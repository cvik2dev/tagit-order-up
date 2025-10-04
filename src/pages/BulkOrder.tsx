import { useState } from 'react';
import { useApp } from '@/contexts/AppContext';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Trash2, FileText, Search, Send, Plus, GripVertical, Check, ChevronsUpDown } from 'lucide-react';
import { toast } from 'sonner';
import { DndContext, DragOverlay, closestCorners, DragEndEvent, DragStartEvent, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Item } from '@/types';
import { nanoid } from 'nanoid';
import { SupplierSelector } from '@/components/SupplierSelector';

interface ParsedItem {
  id: string;
  rawText: string;
  name: string;
  quantity: number;
  matchedItem?: Item;
  supplier?: string;
  category?: string;
}

interface SupplierCard {
  id: string;
  supplier: string;
  items: ParsedItem[];
}

function SortableItem({ item, onRemove, onQuantityChange }: { 
  item: ParsedItem; 
  onRemove: () => void;
  onQuantityChange: (qty: number) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ 
    id: item.id 
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-2 p-2 bg-muted/50 rounded-lg border border-border"
    >
      <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing">
        <GripVertical className="w-4 h-4 text-muted-foreground" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm truncate">
          {item.matchedItem?.emoji} {item.name}
        </p>
        {item.matchedItem && (
          <p className="text-xs text-muted-foreground">{item.category}</p>
        )}
      </div>
      <Input
        type="number"
        min="1"
        value={item.quantity}
        onChange={(e) => onQuantityChange(parseInt(e.target.value) || 1)}
        className="w-16 h-8 text-center text-sm"
      />
      <Button
        size="sm"
        variant="ghost"
        onClick={onRemove}
        className="h-8 w-8 p-0"
      >
        <Trash2 className="w-3 h-3 text-destructive" />
      </Button>
    </div>
  );
}

export default function BulkOrder() {
  const { items, suppliers, addToOrder, addSupplier } = useApp();
  const [rawText, setRawText] = useState('');
  const [showFullText, setShowFullText] = useState(false);
  const [parsedItems, setParsedItems] = useState<ParsedItem[]>([]);
  const [supplierCards, setSupplierCards] = useState<SupplierCard[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const cleanText = () => {
    if (!rawText.trim()) {
      toast.error('No text to clean');
      return;
    }
    
    const cleaned = rawText
      .split('\n')
      .map(line => {
        let cleaned = line.trim();
        // Remove bullets, dashes, asterisks at start
        cleaned = cleaned.replace(/^[-•*●○■□▪▫⦿⦾]\s*/g, '');
        // Remove list numbers like "1. " or "1) " or "1- "
        cleaned = cleaned.replace(/^\d+[.)\-]\s*/g, '');
        // Remove markdown checkbox
        cleaned = cleaned.replace(/^\[[ x]\]\s*/gi, '');
        return cleaned.trim();
      })
      .filter(line => line.length > 0)
      .join('\n');
    
    setRawText(cleaned);
    toast.success('Text cleaned!');
  };

  const parseAndMatch = () => {
    if (!rawText.trim()) {
      toast.error('No text to parse');
      return;
    }
    
    const lines = rawText.split('\n').filter(line => line.trim().length > 0);
    const parsed: ParsedItem[] = [];

    lines.forEach((line, idx) => {
      let name = line.trim();
      let quantity = 1;

      // Try to extract quantity from end of line (supports various formats)
      const qtyMatch = name.match(/\s+(\d+)\s*$/);
      if (qtyMatch) {
        quantity = parseInt(qtyMatch[1], 10);
        name = name.substring(0, name.lastIndexOf(qtyMatch[1])).trim();
      }

      // Try to match with existing items (case-insensitive, flexible matching)
      const matchedItem = items.find(
        item => item.name.toLowerCase().trim() === name.toLowerCase().trim()
      );

      parsed.push({
        id: `parsed-${idx}-${Date.now()}-${Math.random()}`,
        rawText: line,
        name: name,
        quantity: quantity,
        matchedItem: matchedItem,
        supplier: matchedItem?.supplier,
        category: matchedItem?.category,
      });
    });

    setParsedItems(parsed);

    // Generate report
    const matched = parsed.filter(p => p.matchedItem);
    const newItems = parsed.filter(p => !p.matchedItem);
    const supplierGroups = new Set(matched.map(p => p.supplier).filter(Boolean));

    toast.success(
      `Found ${matched.length} items from ${supplierGroups.size} supplier${supplierGroups.size !== 1 ? 's' : ''} and ${newItems.length} new item${newItems.length !== 1 ? 's' : ''}`
    );
  };

  const dispatch = () => {
    if (parsedItems.length === 0) {
      toast.error('No items to dispatch');
      return;
    }

    // Group by supplier
    const groups: Record<string, ParsedItem[]> = {};
    const unsorted: ParsedItem[] = [];

    parsedItems.forEach(item => {
      if (item.supplier) {
        if (!groups[item.supplier]) {
          groups[item.supplier] = [];
        }
        groups[item.supplier].push(item);
      } else {
        unsorted.push(item);
      }
    });

    // Create cards
    const cards: SupplierCard[] = Object.entries(groups).map(([supplier, items]) => ({
      id: `supplier-${supplier}-${Date.now()}`,
      supplier,
      items,
    }));

    // Add unsorted card if there are new items
    if (unsorted.length > 0) {
      cards.push({
        id: `unsorted-${Date.now()}`,
        supplier: 'New Items',
        items: unsorted,
      });
    }

    setSupplierCards(cards);
    toast.success(`Created ${cards.length} supplier cards`);
  };

  const addSupplierCard = () => {
    const newCard: SupplierCard = {
      id: `supplier-new-${Date.now()}`,
      supplier: 'New Supplier',
      items: [],
    };
    setSupplierCards([...supplierCards, newCard]);
  };

  const removeCard = (cardId: string) => {
    setSupplierCards(supplierCards.filter(c => c.id !== cardId));
  };

  const updateCardSupplier = (cardId: string, supplier: string) => {
    setSupplierCards(
      supplierCards.map(c => c.id === cardId ? { ...c, supplier } : c)
    );
  };

  const removeItemFromCard = (cardId: string, itemId: string) => {
    setSupplierCards(
      supplierCards.map(c => 
        c.id === cardId 
          ? { ...c, items: c.items.filter(i => i.id !== itemId) }
          : c
      )
    );
  };

  const updateItemQuantity = (cardId: string, itemId: string, quantity: number) => {
    setSupplierCards(
      supplierCards.map(c => 
        c.id === cardId 
          ? { 
              ...c, 
              items: c.items.map(i => i.id === itemId ? { ...i, quantity } : i) 
            }
          : c
      )
    );
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over || active.id === over.id) return;

    // Find which card the item is being dragged from
    const fromCard = supplierCards.find(card => 
      card.items.some(item => item.id === active.id)
    );

    if (!fromCard) return;

    const draggedItem = fromCard.items.find(i => i.id === active.id);
    if (!draggedItem) return;

    // Find which card it's being dragged to
    // First check if over.id is a card id
    let toCard = supplierCards.find(card => card.id === over.id);
    
    // If not, check if over.id is an item id and find its parent card
    if (!toCard) {
      toCard = supplierCards.find(card => 
        card.items.some(item => item.id === over.id)
      );
    }

    if (!toCard) return;

    // If dragging to a different card
    if (fromCard.id !== toCard.id) {
      // Update the item's supplier if moving to a named supplier
      const updatedItem = {
        ...draggedItem,
        supplier: toCard.supplier !== 'New Items' ? toCard.supplier : undefined,
      };

      setSupplierCards(
        supplierCards.map(card => {
          if (card.id === fromCard.id) {
            return { ...card, items: card.items.filter(i => i.id !== draggedItem.id) };
          }
          if (card.id === toCard.id) {
            return { ...card, items: [...card.items, updatedItem] };
          }
          return card;
        })
      );

      toast.success(`Moved to ${toCard.supplier}`);
    } else {
      // Reordering within the same card
      const oldIndex = fromCard.items.findIndex(i => i.id === active.id);
      const newIndex = fromCard.items.findIndex(i => i.id === over.id);
      
      if (oldIndex !== -1 && newIndex !== -1) {
        const reorderedItems = [...fromCard.items];
        const [movedItem] = reorderedItems.splice(oldIndex, 1);
        reorderedItems.splice(newIndex, 0, movedItem);
        
        setSupplierCards(
          supplierCards.map(card => 
            card.id === fromCard.id ? { ...card, items: reorderedItems } : card
          )
        );
      }
    }
  };

  const finalizeOrder = () => {
    let totalItems = 0;
    supplierCards.forEach(card => {
      card.items.forEach(item => {
        if (item.matchedItem) {
          addToOrder(item.matchedItem, item.quantity);
          totalItems++;
        }
      });
    });
    
    toast.success(`Added ${totalItems} items to order`);
    // Reset state
    setSupplierCards([]);
    setParsedItems([]);
    setRawText('');
  };

  const activeItem = supplierCards
    .flatMap(c => c.items)
    .find(i => i.id === activeId);

  return (
    <div className="min-h-screen pb-20 px-4 pt-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">Bulk Order</h1>
          <p className="text-muted-foreground">Paste, clean, match, and organize your orders</p>
        </div>

        {/* Input Section */}
        <Card className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Paste Your List
            </h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowFullText(!showFullText)}
            >
              {showFullText ? 'Show Less' : 'Show More'}
            </Button>
          </div>
          
          <Textarea
            placeholder="Paste your items here (one per line)&#10;Example:&#10;- Tomatoes 5&#10;• Onions 3&#10;1. Garlic 2"
            value={rawText}
            onChange={(e) => setRawText(e.target.value)}
            className={showFullText ? 'min-h-[400px]' : 'min-h-[200px]'}
          />

          <div className="flex gap-2 flex-wrap">
            <Button onClick={cleanText} variant="outline" size="sm" className="gap-2">
              <FileText className="w-4 h-4" />
              Clean Text
            </Button>
            <Button onClick={parseAndMatch} variant="outline" size="sm" className="gap-2">
              <Search className="w-4 h-4" />
              Parse & Match
            </Button>
            <Button onClick={dispatch} size="sm" className="gap-2">
              <Send className="w-4 h-4" />
              Dispatch to Cards
            </Button>
          </div>

          {parsedItems.length > 0 && (
            <div className="pt-2 border-t">
              <div className="flex gap-2 flex-wrap">
                <Badge variant="secondary">
                  {parsedItems.length} items parsed
                </Badge>
                <Badge variant="default">
                  {parsedItems.filter(p => p.matchedItem).length} matched
                </Badge>
                <Badge variant="outline">
                  {parsedItems.filter(p => !p.matchedItem).length} new
                </Badge>
              </div>
            </div>
          )}
        </Card>

        {/* Kanban Board */}
        {supplierCards.length > 0 && (
          <>
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Organize by Supplier</h2>
              <div className="flex gap-2">
                <Button onClick={addSupplierCard} variant="outline" size="sm" className="gap-2">
                  <Plus className="w-4 h-4" />
                  Add Card
                </Button>
                <Button onClick={finalizeOrder} size="sm" className="gap-2 bg-gradient-primary">
                  <Send className="w-4 h-4" />
                  Add to Order
                </Button>
              </div>
            </div>

            <DndContext
              sensors={sensors}
              collisionDetection={closestCorners}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {supplierCards.map(card => (
                  <Card key={card.id} className="p-4 space-y-3 bg-card/50">
                    <div className="flex items-center gap-2">
                      <SupplierSelector
                        value={card.supplier}
                        suppliers={suppliers}
                        onSelect={(supplier) => updateCardSupplier(card.id, supplier)}
                        onCreateNew={(name) => {
                          addSupplier({ name });
                          updateCardSupplier(card.id, name);
                        }}
                      />
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => removeCard(card.id)}
                        className="h-8 w-8 p-0 shrink-0"
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>

                    <div className="text-xs text-muted-foreground">
                      {card.items.length} items
                    </div>

                    <SortableContext
                      items={card.items.map(i => i.id)}
                      strategy={verticalListSortingStrategy}
                    >
                      <div 
                        className="space-y-2 min-h-[100px] p-2 rounded-lg border-2 border-dashed border-border/50" 
                        id={card.id}
                      >
                        {card.items.length === 0 && (
                          <p className="text-muted-foreground text-sm text-center py-4">
                            Drag items here
                          </p>
                        )}
                        {card.items.map(item => (
                          <SortableItem
                            key={item.id}
                            item={item}
                            onRemove={() => removeItemFromCard(card.id, item.id)}
                            onQuantityChange={(qty) => updateItemQuantity(card.id, item.id, qty)}
                          />
                        ))}
                      </div>
                    </SortableContext>
                  </Card>
                ))}
              </div>

              <DragOverlay>
                {activeItem ? (
                  <div className="flex items-center gap-2 p-2 bg-muted rounded-lg border border-border shadow-lg">
                    <GripVertical className="w-4 h-4 text-muted-foreground" />
                    <p className="font-medium text-sm">
                      {activeItem.matchedItem?.emoji} {activeItem.name}
                    </p>
                    <Badge variant="secondary" className="ml-auto">
                      {activeItem.quantity}
                    </Badge>
                  </div>
                ) : null}
              </DragOverlay>
            </DndContext>
          </>
        )}
      </div>
    </div>
  );
}
