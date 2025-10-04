import { Item, Category, Supplier, Tag, AppSettings } from '@/types';

const STORAGE_KEYS = {
  ITEMS: 'tagcreator_items',
  CATEGORIES: 'tagcreator_categories',
  SUPPLIERS: 'tagcreator_suppliers',
  TAGS: 'tagcreator_tags',
  SETTINGS: 'tagcreator_settings',
};

class StorageManager {
  private cache: Map<string, any> = new Map();

  // Generic get/set with cache
  private get<T>(key: string, defaultValue: T): T {
    if (this.cache.has(key)) {
      return this.cache.get(key);
    }
    try {
      const data = localStorage.getItem(key);
      const parsed = data ? JSON.parse(data) : defaultValue;
      this.cache.set(key, parsed);
      return parsed;
    } catch {
      return defaultValue;
    }
  }

  private set<T>(key: string, value: T): void {
    this.cache.set(key, value);
    localStorage.setItem(key, JSON.stringify(value));
  }

  // Items
  getItems(): Item[] {
    return this.get<Item[]>(STORAGE_KEYS.ITEMS, []);
  }

  setItems(items: Item[]): void {
    this.set(STORAGE_KEYS.ITEMS, items);
  }

  // Categories
  getCategories(): Category[] {
    return this.get<Category[]>(STORAGE_KEYS.CATEGORIES, []);
  }

  setCategories(categories: Category[]): void {
    this.set(STORAGE_KEYS.CATEGORIES, categories);
  }

  // Suppliers
  getSuppliers(): Supplier[] {
    return this.get<Supplier[]>(STORAGE_KEYS.SUPPLIERS, []);
  }

  setSuppliers(suppliers: Supplier[]): void {
    this.set(STORAGE_KEYS.SUPPLIERS, suppliers);
  }

  // Tags
  getTags(): Tag[] {
    return this.get<Tag[]>(STORAGE_KEYS.TAGS, []);
  }

  setTags(tags: Tag[]): void {
    this.set(STORAGE_KEYS.TAGS, tags);
  }

  // Settings
  getSettings(): AppSettings {
    return this.get<AppSettings>(STORAGE_KEYS.SETTINGS, {});
  }

  setSettings(settings: AppSettings): void {
    this.set(STORAGE_KEYS.SETTINGS, settings);
  }

  // Export all data
  exportData() {
    return {
      items: this.getItems(),
      categories: this.getCategories(),
      suppliers: this.getSuppliers(),
      tags: this.getTags(),
      settings: this.getSettings(),
      exportedAt: new Date().toISOString(),
    };
  }

  // Import all data
  importData(data: any): void {
    if (data.items) this.setItems(data.items);
    if (data.categories) this.setCategories(data.categories);
    if (data.suppliers) this.setSuppliers(data.suppliers);
    if (data.tags) this.setTags(data.tags);
    if (data.settings) this.setSettings(data.settings);
    this.cache.clear(); // Clear cache to force refresh
  }

  // Clear all data
  clearAll(): void {
    Object.values(STORAGE_KEYS).forEach(key => localStorage.removeItem(key));
    this.cache.clear();
  }
}

export const storage = new StorageManager();
