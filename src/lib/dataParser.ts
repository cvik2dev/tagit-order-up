import { Item, Category, Supplier } from '@/types';
import { nanoid } from 'nanoid';

export function parseDefaultData(data: any[]): {
  items: Item[];
  categories: Category[];
  suppliers: Supplier[];
} {
  const categoryMap = data[0];
  const supplierMap = data[1];

  const categoriesSet = new Map<string, Category>();
  const suppliersSet = new Map<string, Supplier>();
  const items: Item[] = [];

  Object.entries(categoryMap).forEach(([itemName, categoryStr]) => {
    if (itemName === 'item') return;

    const category = categoryStr as string;
    const supplier = supplierMap[itemName] || 'Unknown';

    // Extract emoji from category
    const emojiMatch = category.match(/(\p{Emoji})/u);
    const categoryName = category.replace(/(\p{Emoji})/gu, '').trim();
    const emoji = emojiMatch ? emojiMatch[0] : '📦';

    // Add category
    if (!categoriesSet.has(categoryName)) {
      categoriesSet.set(categoryName, {
        id: nanoid(),
        name: categoryName,
        emoji,
      });
    }

    // Add supplier
    if (!suppliersSet.has(supplier)) {
      suppliersSet.set(supplier, {
        id: nanoid(),
        name: supplier,
      });
    }

    // Add item
    items.push({
      id: nanoid(),
      name: itemName,
      category: categoryName,
      supplier,
      tags: [],
      emoji,
    });
  });

  return {
    items,
    categories: Array.from(categoriesSet.values()),
    suppliers: Array.from(suppliersSet.values()),
  };
}

export function parseQuickOrder(text: string, items: Item[]): { item: Item; quantity: number } | null {
  const match = text.trim().match(/^(.+?)\s+(\d+)$/);
  if (!match) return null;

  const [, itemName, qty] = match;
  const foundItem = items.find(
    i => i.name.toLowerCase() === itemName.toLowerCase()
  );

  if (!foundItem) return null;

  return {
    item: foundItem,
    quantity: parseInt(qty, 10),
  };
}
