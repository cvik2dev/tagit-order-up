import { useState } from 'react';
import { useApp } from '@/contexts/AppContext';
import { parseQuickOrder } from '@/lib/dataParser';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Zap, ArrowRight, Package, Tag, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

export default function Home() {
  const { items, categories, suppliers, addToOrder, currentOrder } = useApp();
  const [quickText, setQuickText] = useState('');
  const navigate = useNavigate();

  const handleQuickOrder = () => {
    if (!quickText.trim()) return;

    const parsed = parseQuickOrder(quickText, items);
    if (parsed) {
      addToOrder(parsed.item, parsed.quantity);
      toast.success(`Added ${parsed.quantity}x ${parsed.item.name} to order`);
      setQuickText('');
    } else {
      toast.error('Invalid format. Use: "Item name 5"');
    }
  };

  const stats = [
    { label: 'Items', value: items.length, icon: Package, color: 'text-primary' },
    { label: 'Categories', value: categories.length, icon: Tag, color: 'text-secondary' },
    { label: 'Suppliers', value: suppliers.length, icon: Users, color: 'text-accent' },
  ];

  return (
    <div className="min-h-screen pb-20 px-4 pt-6">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            TagCreator
          </h1>
          <p className="text-muted-foreground">Manage orders with speed & style</p>
        </div>

        {/* Quick Order */}
        <Card className="p-6 bg-gradient-card border-primary/20 shadow-glow-primary">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-primary" />
              <h2 className="text-lg font-semibold">Quick Order</h2>
            </div>
            <p className="text-sm text-muted-foreground">
              Type item name and quantity (e.g., "Mozzarella 5")
            </p>
            <div className="flex gap-2">
              <Input
                value={quickText}
                onChange={(e) => setQuickText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleQuickOrder()}
                placeholder="Item name 5"
                className="bg-input border-border"
              />
              <Button 
                onClick={handleQuickOrder}
                className="bg-gradient-primary hover:opacity-90 transition-opacity"
              >
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          {stats.map(({ label, value, icon: Icon, color }) => (
            <Card key={label} className="p-4 bg-card border-border">
              <div className="space-y-2">
                <Icon className={`w-5 h-5 ${color}`} />
                <div>
                  <p className="text-2xl font-bold">{value}</p>
                  <p className="text-xs text-muted-foreground">{label}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Current Order Preview */}
        {currentOrder.length > 0 && (
          <Card className="p-6 bg-card border-border">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">Current Order</h3>
                <span className="text-sm text-muted-foreground">
                  {currentOrder.length} items
                </span>
              </div>
              <div className="space-y-2">
                {currentOrder.slice(0, 3).map(({ item, quantity }) => (
                  <div key={item.id} className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2">
                      <span>{item.emoji}</span>
                      <span>{item.name}</span>
                    </span>
                    <span className="text-muted-foreground">×{quantity}</span>
                  </div>
                ))}
                {currentOrder.length > 3 && (
                  <p className="text-xs text-muted-foreground text-center">
                    +{currentOrder.length - 3} more
                  </p>
                )}
              </div>
              <Button 
                onClick={() => navigate('/order')}
                variant="outline" 
                className="w-full"
              >
                View Full Order
              </Button>
            </div>
          </Card>
        )}

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-3">
          <Button
            onClick={() => navigate('/items')}
            variant="outline"
            className="h-24 flex-col gap-2 border-primary/30 hover:bg-primary/10"
          >
            <Package className="w-6 h-6" />
            <span>Browse Items</span>
          </Button>
          <Button
            onClick={() => navigate('/order')}
            variant="outline"
            className="h-24 flex-col gap-2 border-secondary/30 hover:bg-secondary/10"
          >
            <Tag className="w-6 h-6" />
            <span>Create Order</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
