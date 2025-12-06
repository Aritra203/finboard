'use client';

import { useState, useRef } from 'react';
import { Download, Upload, FileJson, AlertCircle, Check, Trash2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useDashboardStore, DashboardExport } from '@/store/dashboardStore';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface ExportImportModalProps {
  open: boolean;
  onClose: () => void;
}

export function ExportImportModal({ open, onClose }: ExportImportModalProps) {
  const [activeTab, setActiveTab] = useState<'export' | 'import'>('export');
  const [importMode, setImportMode] = useState<'replace' | 'merge'>('merge');
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importPreview, setImportPreview] = useState<DashboardExport | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { widgets, exportDashboard, importDashboard, clearAllWidgets } = useDashboardStore();

  const handleExport = () => {
    const data = exportDashboard();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `finboard-dashboard-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast.success('Dashboard exported successfully!', {
      description: `Exported ${data.widgets.length} widget(s)`,
    });
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportFile(file);
    setImportError(null);
    setImportPreview(null);

    try {
      const text = await file.text();
      const data = JSON.parse(text) as DashboardExport;

      if (!data.version || !data.widgets || !Array.isArray(data.widgets)) {
        throw new Error('Invalid dashboard file format');
      }

      setImportPreview(data);
    } catch (error) {
      setImportError(error instanceof Error ? error.message : 'Failed to parse file');
      setImportFile(null);
    }
  };

  const handleImport = () => {
    if (!importPreview) return;

    const result = importDashboard(importPreview, importMode);
    
    if (result.success) {
      toast.success(result.message);
      handleClose();
    } else {
      toast.error(result.message);
    }
  };

  const handleClearAll = () => {
    if (confirm('Are you sure you want to delete all widgets? This cannot be undone.')) {
      clearAllWidgets();
      toast.success('All widgets cleared');
    }
  };

  const handleClose = () => {
    setImportFile(null);
    setImportPreview(null);
    setImportError(null);
    setImportMode('merge');
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="glass-card max-w-lg p-0 gap-0 border-border/50">
        <DialogHeader className="p-6 pb-4 border-b border-border/50">
          <DialogTitle className="flex items-center gap-2 text-xl font-semibold">
            <FileJson className="w-5 h-5 text-primary" />
            Export / Import Dashboard
          </DialogTitle>
        </DialogHeader>

        {/* Tab Buttons */}
        <div className="flex border-b border-border/50">
          <button
            onClick={() => setActiveTab('export')}
            className={cn(
              "flex-1 px-4 py-3 text-sm font-medium transition-colors",
              activeTab === 'export' 
                ? "text-primary border-b-2 border-primary" 
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Download className="w-4 h-4 inline-block mr-2" />
            Export
          </button>
          <button
            onClick={() => setActiveTab('import')}
            className={cn(
              "flex-1 px-4 py-3 text-sm font-medium transition-colors",
              activeTab === 'import' 
                ? "text-primary border-b-2 border-primary" 
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Upload className="w-4 h-4 inline-block mr-2" />
            Import
          </button>
        </div>

        <div className="p-6">
          {activeTab === 'export' ? (
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-secondary/30 border border-border/50">
                <h3 className="font-medium mb-2">Current Dashboard</h3>
                <p className="text-sm text-muted-foreground">
                  {widgets.length} widget{widgets.length !== 1 ? 's' : ''} configured
                </p>
              </div>

              <p className="text-sm text-muted-foreground">
                Export your dashboard configuration as a JSON file. This includes all widget settings,
                API URLs, and display preferences. Your data is not included in the export.
              </p>

              <div className="flex gap-3">
                <Button onClick={handleExport} className="flex-1 gap-2" disabled={widgets.length === 0}>
                  <Download className="w-4 h-4" />
                  Export Dashboard
                </Button>
                <Button 
                  variant="destructive" 
                  onClick={handleClearAll}
                  disabled={widgets.length === 0}
                  className="gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  Clear All
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div 
                onClick={() => fileInputRef.current?.click()}
                className={cn(
                  "border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors",
                  importError 
                    ? "border-destructive/50 bg-destructive/5" 
                    : importPreview 
                      ? "border-success/50 bg-success/5"
                      : "border-border/50 hover:border-primary/50 hover:bg-primary/5"
                )}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                
                {importError ? (
                  <>
                    <AlertCircle className="w-10 h-10 text-destructive mx-auto mb-2" />
                    <p className="text-sm text-destructive">{importError}</p>
                    <p className="text-xs text-muted-foreground mt-1">Click to try again</p>
                  </>
                ) : importPreview ? (
                  <>
                    <Check className="w-10 h-10 text-success mx-auto mb-2" />
                    <p className="text-sm font-medium">{importFile?.name}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {importPreview.widgets.length} widget(s) • Exported {new Date(importPreview.exportedAt).toLocaleDateString()}
                    </p>
                  </>
                ) : (
                  <>
                    <Upload className="w-10 h-10 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">
                      Click to select a dashboard JSON file
                    </p>
                  </>
                )}
              </div>

              {importPreview && (
                <>
                  <div className="space-y-3">
                    <Label>Import Mode</Label>
                    <RadioGroup value={importMode} onValueChange={(v) => setImportMode(v as 'replace' | 'merge')}>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="merge" id="merge" />
                        <Label htmlFor="merge" className="font-normal cursor-pointer">
                          Merge - Add to existing widgets
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="replace" id="replace" />
                        <Label htmlFor="replace" className="font-normal cursor-pointer">
                          Replace - Remove existing widgets first
                        </Label>
                      </div>
                    </RadioGroup>
                  </div>

                  <div className="p-3 rounded-lg bg-secondary/30 border border-border/50">
                    <p className="text-xs text-muted-foreground">
                      {importMode === 'merge' 
                        ? `This will add ${importPreview.widgets.length} widget(s) to your existing ${widgets.length} widget(s).`
                        : `This will replace your ${widgets.length} widget(s) with ${importPreview.widgets.length} new widget(s).`
                      }
                    </p>
                  </div>
                </>
              )}

              <Button 
                onClick={handleImport} 
                className="w-full gap-2" 
                disabled={!importPreview}
              >
                <Upload className="w-4 h-4" />
                Import Dashboard
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
