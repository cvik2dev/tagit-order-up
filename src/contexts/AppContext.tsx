import React, { createContext, useContext, useState, useEffect } from 'react';
import { Item, Category, Supplier, Tag, AppSettings, OrderItem } from '@/types';
import { storage } from '@/lib/storage';
import { parseDefaultData } from '@/lib/dataParser';
import { nanoid } from 'nanoid';

interface AppContextType {
  items: Item[];
  categories: Category[];
  suppliers: Supplier[];
  tags: Tag[];
  settings: AppSettings;
  currentOrder: OrderItem[];
  
  addItem: (item: Omit<Item, 'id'>) => void;
  updateItem: (id: string, item: Partial<Item>) => void;
  deleteItem: (id: string) => void;
  
  addCategory: (category: Omit<Category, 'id'>) => void;
  updateCategory: (id: string, category: Partial<Category>) => void;
  deleteCategory: (id: string) => void;
  
  addSupplier: (supplier: Omit<Supplier, 'id'>) => void;
  updateSupplier: (id: string, supplier: Partial<Supplier>) => void;
  deleteSupplier: (id: string) => void;
  
  addTag: (tag: Omit<Tag, 'id'>) => void;
  updateTag: (id: string, tag: Partial<Tag>) => void;
  deleteTag: (id: string) => void;
  
  updateSettings: (settings: Partial<AppSettings>) => void;
  
  addToOrder: (item: Item, quantity: number) => void;
  updateOrderItem: (itemId: string, quantity: number) => void;
  removeFromOrder: (itemId: string) => void;
  clearOrder: () => void;
  
  exportData: () => any;
  importData: (data: any) => void;
  loadDefaultData: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<Item[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [settings, setSettings] = useState<AppSettings>({});
  const [currentOrder, setCurrentOrder] = useState<OrderItem[]>([]);
  const [initialized, setInitialized] = useState(false);

  // Load data on mount
  useEffect(() => {
    const storedItems = storage.getItems();
    const storedCategories = storage.getCategories();
    const storedSuppliers = storage.getSuppliers();
    const storedTags = storage.getTags();
    const storedSettings = storage.getSettings();

    if (storedItems.length > 0) {
      setItems(storedItems);
      setCategories(storedCategories);
      setSuppliers(storedSuppliers);
      setTags(storedTags);
      setSettings(storedSettings);
    } else {
      // Load default data on first launch
      loadDefaultData();
    }
    setInitialized(true);
  }, []);

  // Save to storage when data changes
  useEffect(() => {
    if (initialized) {
      storage.setItems(items);
    }
  }, [items, initialized]);

  useEffect(() => {
    if (initialized) {
      storage.setCategories(categories);
    }
  }, [categories, initialized]);

  useEffect(() => {
    if (initialized) {
      storage.setSuppliers(suppliers);
    }
  }, [suppliers, initialized]);

  useEffect(() => {
    if (initialized) {
      storage.setTags(tags);
    }
  }, [tags, initialized]);

  useEffect(() => {
    if (initialized) {
      storage.setSettings(settings);
    }
  }, [settings, initialized]);

  const loadDefaultData = async () => {
    try {
      const response = await fetch('/default-data.json');
      const data = await response.json();
      const parsed = parseDefaultData(data);
      
      setItems(parsed.items);
      setCategories(parsed.categories);
      setSuppliers(parsed.suppliers);
    } catch (error) {
      console.error('Failed to load default data:', error);
    }
  };

  // Items
  const addItem = (item: Omit<Item, 'id'>) => {
    setItems(prev => [...prev, { ...item, id: nanoid() }]);
  };

  const updateItem = (id: string, updates: Partial<Item>) => {
    setItems(prev => prev.map(item => item.id === id ? { ...item, ...updates } : item));
  };

  const deleteItem = (id: string) => {
    setItems(prev => prev.filter(item => item.id !== id));
  };

  // Categories
  const addCategory = (category: Omit<Category, 'id'>) => {
    setCategories(prev => [...prev, { ...category, id: nanoid() }]);
  };

  const updateCategory = (id: string, updates: Partial<Category>) => {
    setCategories(prev => prev.map(cat => cat.id === id ? { ...cat, ...updates } : cat));
  };

  const deleteCategory = (id: string) => {
    setCategories(prev => prev.filter(cat => cat.id !== id));
  };

  // Suppliers
  const addSupplier = (supplier: Omit<Supplier, 'id'>) => {
    setSuppliers(prev => [...prev, { ...supplier, id: nanoid() }]);
  };

  const updateSupplier = (id: string, updates: Partial<Supplier>) => {
    setSuppliers(prev => prev.map(sup => sup.id === id ? { ...sup, ...updates } : sup));
  };

  const deleteSupplier = (id: string) => {
    setSuppliers(prev => prev.filter(sup => sup.id !== id));
  };

  // Tags
  const addTag = (tag: Omit<Tag, 'id'>) => {
    setTags(prev => [...prev, { ...tag, id: nanoid() }]);
  };

  const updateTag = (id: string, updates: Partial<Tag>) => {
    setTags(prev => prev.map(tag => tag.id === id ? { ...tag, ...updates } : tag));
  };

  const deleteTag = (id: string) => {
    setTags(prev => prev.filter(tag => tag.id !== id));
  };

  // Settings
  const updateSettings = (updates: Partial<AppSettings>) => {
    setSettings(prev => ({ ...prev, ...updates }));
  };

  // Order
  const addToOrder = (item: Item, quantity: number) => {
    setCurrentOrder(prev => {
      const existing = prev.find(oi => oi.item.id === item.id);
      if (existing) {
        return prev.map(oi => 
          oi.item.id === item.id 
            ? { ...oi, quantity: oi.quantity + quantity }
            : oi
        );
      }
      return [...prev, { item, quantity }];
    });
  };

  const updateOrderItem = (itemId: string, quantity: number) => {
    setCurrentOrder(prev => 
      prev.map(oi => oi.item.id === itemId ? { ...oi, quantity } : oi)
    );
  };

  const removeFromOrder = (itemId: string) => {
    setCurrentOrder(prev => prev.filter(oi => oi.item.id !== itemId));
  };

  const clearOrder = () => {
    setCurrentOrder([]);
  };

  // Import/Export
  const exportData = () => storage.exportData();

  const importData = (data: any) => {
    storage.importData(data);
    setItems(storage.getItems());
    setCategories(storage.getCategories());
    setSuppliers(storage.getSuppliers());
    setTags(storage.getTags());
    setSettings(storage.getSettings());
  };

  return (
    <AppContext.Provider
      value={{
        items,
        categories,
        suppliers,
        tags,
        settings,
        currentOrder,
        addItem,
        updateItem,
        deleteItem,
        addCategory,
        updateCategory,
        deleteCategory,
        addSupplier,
        updateSupplier,
        deleteSupplier,
        addTag,
        updateTag,
        deleteTag,
        updateSettings,
        addToOrder,
        updateOrderItem,
        removeFromOrder,
        clearOrder,
        exportData,
        importData,
        loadDefaultData,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
}
