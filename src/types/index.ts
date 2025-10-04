export interface Item {
  id: string;
  name: string;
  category: string;
  supplier: string;
  tags: string[];
  emoji?: string;
}

export interface Category {
  id: string;
  name: string;
  emoji: string;
}

export interface Supplier {
  id: string;
  name: string;
  contact?: string;
}

export interface Tag {
  id: string;
  name: string;
  color: string;
}

export interface OrderItem {
  item: Item;
  quantity: number;
}

export interface Order {
  id: string;
  items: OrderItem[];
  createdAt: Date;
  supplier?: string;
}

export interface AppSettings {
  defaultSupplier?: string;
  orderTemplate?: string;
}
