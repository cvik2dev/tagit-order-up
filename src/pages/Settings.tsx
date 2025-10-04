import { useApp } from '@/contexts/AppContext';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Download, Upload, Database, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { storage } from '@/lib/storage';

export default function Settings() {
  const { exportData, importData, loadDefaultData, items, categories, suppliers } = useApp();

  const handleExport = () => {
    const data = exportData();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tagcreator-export-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Data exported successfully!');
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      try {
        const text = await file.text();
        const data = JSON.parse(text);
        importData(data);
        toast.success('Data imported successfully!');
      } catch (error) {
        toast.error('Failed to import data. Invalid file format.');
      }
    };
    input.click();
  };

  const handleResetToDefault = () => {
    if (confirm('Reset to default data? This will clear all your current data.')) {
      storage.clearAll();
      loadDefaultData();
      toast.success('Reset to default data');
    }
  };

  const handleClearAll = () => {
    if (confirm('Clear all data? This action cannot be undone.')) {
      storage.clearAll();
      window.location.reload();
    }
  };

  return (
    <div className="min-h-screen pb-20 px-4 pt-6">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">Settings</h1>
          <p className="text-muted-foreground">Manage your data and preferences</p>
        </div>

        {/* Stats */}
        <Card className="p-4 bg-card border-border">
          <h3 className="font-semibold mb-3">Data Summary</h3>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-primary">{items.length}</p>
              <p className="text-xs text-muted-foreground">Items</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-secondary">{categories.length}</p>
              <p className="text-xs text-muted-foreground">Categories</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-accent">{suppliers.length}</p>
              <p className="text-xs text-muted-foreground">Suppliers</p>
            </div>
          </div>
        </Card>

        {/* Data Management */}
        <Card className="p-4 bg-card border-border">
          <h3 className="font-semibold mb-3">Data Management</h3>
          <div className="space-y-2">
            <Button
              onClick={handleExport}
              variant="outline"
              className="w-full justify-start gap-2"
            >
              <Download className="w-4 h-4" />
              Export Data (JSON)
            </Button>
            <Button
              onClick={handleImport}
              variant="outline"
              className="w-full justify-start gap-2"
            >
              <Upload className="w-4 h-4" />
              Import Data (JSON)
            </Button>
            <Button
              onClick={handleResetToDefault}
              variant="outline"
              className="w-full justify-start gap-2"
            >
              <Database className="w-4 h-4" />
              Reset to Default Data
            </Button>
          </div>
        </Card>

        {/* Danger Zone */}
        <Card className="p-4 bg-destructive/10 border-destructive/30">
          <h3 className="font-semibold mb-3 text-destructive">Danger Zone</h3>
          <Button
            onClick={handleClearAll}
            variant="destructive"
            className="w-full gap-2"
          >
            <Trash2 className="w-4 h-4" />
            Clear All Data
          </Button>
        </Card>

        {/* Info */}
        <Card className="p-4 bg-muted border-border">
          <h3 className="font-semibold mb-2 text-sm">About</h3>
          <p className="text-xs text-muted-foreground">
            TagCreator - Order Management System
            <br />
            All data is stored locally in your browser.
            <br />
            Export regularly to keep backups.
          </p>
        </Card>
      </div>
    </div>
  );
}
