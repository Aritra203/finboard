'use client';

import { useState } from 'react';
import { X, Loader2, Check, AlertCircle, Search, LayoutGrid, Table, LineChart, CandlestickChart, Wifi, WifiOff } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { useDashboardStore, DisplayMode, WidgetField, ChartType, ChartInterval, ConnectionType } from '@/store/dashboardStore';
import { testApiConnection, extractFields, FieldInfo, formatValue } from '@/lib/apiUtils';
import { isWebSocketURL } from '@/lib/websocket';
import { cn } from '@/lib/utils';

interface AddWidgetModalProps {
  open: boolean;
  onClose: () => void;
}

export function AddWidgetModal({ open, onClose }: AddWidgetModalProps) {
  const [step, setStep] = useState<1 | 2>(1);
  const [name, setName] = useState('');
  const [apiUrl, setApiUrl] = useState('');
  const [connectionType, setConnectionType] = useState<ConnectionType>('http');
  const [refreshInterval, setRefreshInterval] = useState(30);
  const [displayMode, setDisplayMode] = useState<DisplayMode>('card');
  const [chartType, setChartType] = useState<ChartType>('line');
  const [chartInterval, setChartInterval] = useState<ChartInterval>('daily');
  const [selectedFields, setSelectedFields] = useState<WidgetField[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showArraysOnly, setShowArraysOnly] = useState(false);
  
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; error?: string; fieldCount?: number } | null>(null);
  const [apiData, setApiData] = useState<unknown>(null);
  const [availableFields, setAvailableFields] = useState<FieldInfo[]>([]);
  
  const addWidget = useDashboardStore((state) => state.addWidget);
  
  const resetForm = () => {
    setStep(1);
    setName('');
    setApiUrl('');
    setConnectionType('http');
    setRefreshInterval(30);
    setDisplayMode('card');
    setChartType('line');
    setChartInterval('daily');
    setSelectedFields([]);
    setSearchQuery('');
    setShowArraysOnly(false);
    setTesting(false);
    setTestResult(null);
    setApiData(null);
    setAvailableFields([]);
  };
  
  const handleClose = () => {
    resetForm();
    onClose();
  };
  
  const handleTestApi = async () => {
    setTesting(true);
    setTestResult(null);
    
    const result = await testApiConnection(apiUrl);
    setTestResult(result);
    
    if (result.success && result.data) {
      setApiData(result.data);
      const fields = extractFields(result.data);
      setAvailableFields(fields);
    }
    
    setTesting(false);
  };
  
  const handleFieldToggle = (field: FieldInfo) => {
    const exists = selectedFields.find((f) => f.path === field.path);
    if (exists) {
      setSelectedFields(selectedFields.filter((f) => f.path !== field.path));
    } else {
      setSelectedFields([...selectedFields, {
        path: field.path,
        label: field.label,
        type: field.type,
      }]);
    }
  };
  
  const handleSubmit = () => {
    if (!name || !apiUrl || selectedFields.length === 0) return;
    
    addWidget({
      name,
      apiUrl,
      connectionType,
      refreshInterval,
      displayMode,
      chartType,
      chartInterval,
      selectedFields,
    });
    
    handleClose();
  };
  
  const filteredFields = availableFields.filter((field) => {
    const matchesSearch = field.path.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          field.label.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesArrayFilter = !showArraysOnly || field.isArray;
    return matchesSearch && matchesArrayFilter;
  });
  
  const displayModes: { mode: DisplayMode; icon: React.ReactNode; label: string }[] = [
    { mode: 'card', icon: <LayoutGrid className="w-4 h-4" />, label: 'Card' },
    { mode: 'table', icon: <Table className="w-4 h-4" />, label: 'Table' },
    { mode: 'chart', icon: <LineChart className="w-4 h-4" />, label: 'Chart' },
  ];

  const chartTypes: { type: ChartType; icon: React.ReactNode; label: string }[] = [
    { type: 'line', icon: <LineChart className="w-4 h-4" />, label: 'Line' },
    { type: 'candlestick', icon: <CandlestickChart className="w-4 h-4" />, label: 'Candlestick' },
  ];

  const chartIntervals: { interval: ChartInterval; label: string }[] = [
    { interval: 'daily', label: 'Daily' },
    { interval: 'weekly', label: 'Weekly' },
    { interval: 'monthly', label: 'Monthly' },
  ];
  
  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="glass-card max-w-2xl max-h-[85vh] p-0 gap-0 border-border/50">
        <DialogHeader className="p-6 pb-4 border-b border-border/50">
          <DialogTitle className="text-xl font-semibold">Add New Widget</DialogTitle>
        </DialogHeader>
        
        <div className="p-6 overflow-hidden flex flex-col max-h-[calc(85vh-140px)]">
          {step === 1 ? (
            <div className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="name">Widget Name</Label>
                <Input
                  id="name"
                  placeholder="e.g., Bitcoin Price Tracker"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="bg-secondary/50 border-border/50"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="apiUrl">API URL</Label>
                <div className="flex gap-2">
                  <Input
                    id="apiUrl"
                    placeholder="e.g., https://api.coinbase.com/v2/exchange-rates?currency=BTC"
                    value={apiUrl}
                    onChange={(e) => {
                      const url = e.target.value;
                      setApiUrl(url);
                      // Auto-detect connection type
                      if (isWebSocketURL(url)) {
                        setConnectionType('websocket');
                      } else {
                        setConnectionType('http');
                      }
                    }}
                    className="bg-secondary/50 border-border/50 flex-1"
                  />
                  <Button
                    onClick={handleTestApi}
                    disabled={!apiUrl || testing}
                    variant="outline"
                    className="shrink-0"
                  >
                    {testing ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Test'}
                  </Button>
                </div>
                
                {/* Connection Type Indicator */}
                <div className="flex items-center gap-2 text-xs">
                  {connectionType === 'websocket' ? (
                    <div className="flex items-center gap-1.5 text-emerald-500">
                      <Wifi className="w-3 h-3" />
                      <span>WebSocket (Real-time)</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 text-blue-500">
                      <WifiOff className="w-3 h-3" />
                      <span>HTTP (Polling)</span>
                    </div>
                  )}
                  {connectionType === 'websocket' && (
                    <span className="text-muted-foreground ml-auto">
                      Refresh interval will be ignored for WebSocket connections
                    </span>
                  )}
                </div>
                
                {testResult && (
                  <div className={cn(
                    "flex items-center gap-2 text-sm p-3 rounded-lg",
                    testResult.success 
                      ? "bg-success/10 text-success" 
                      : "bg-destructive/10 text-destructive"
                  )}>
                    {testResult.success ? (
                      <>
                        <Check className="w-4 h-4" />
                        <span>API connection successful! {testResult.fieldCount} top-level fields found.</span>
                      </>
                    ) : (
                      <>
                        <AlertCircle className="w-4 h-4" />
                        <span>{testResult.error}</span>
                      </>
                    )}
                  </div>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="refresh">Refresh Interval (seconds)</Label>
                <Input
                  id="refresh"
                  type="number"
                  min={5}
                  max={3600}
                  value={refreshInterval}
                  onChange={(e) => setRefreshInterval(parseInt(e.target.value) || 30)}
                  className="bg-secondary/50 border-border/50 w-32"
                />
              </div>
            </div>
          ) : (
            <div className="space-y-4 flex flex-col flex-1 overflow-hidden">
              <div className="space-y-3">
                <Label>Display Mode</Label>
                <div className="flex gap-2">
                  {displayModes.map(({ mode, icon, label }) => (
                    <Button
                      key={mode}
                      variant={displayMode === mode ? 'default' : 'outline'}
                      onClick={() => setDisplayMode(mode)}
                      className="flex-1"
                    >
                      {icon}
                      <span className="ml-2">{label}</span>
                    </Button>
                  ))}
                </div>
              </div>

              {displayMode === 'chart' && (
                <>
                  <div className="space-y-3">
                    <Label>Chart Type</Label>
                    <div className="flex gap-2">
                      {chartTypes.map(({ type, icon, label }) => (
                        <Button
                          key={type}
                          variant={chartType === type ? 'default' : 'outline'}
                          onClick={() => setChartType(type)}
                          className="flex-1"
                        >
                          {icon}
                          <span className="ml-2">{label}</span>
                        </Button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Label>Time Interval</Label>
                    <div className="flex gap-2">
                      {chartIntervals.map(({ interval, label }) => (
                        <Button
                          key={interval}
                          variant={chartInterval === interval ? 'default' : 'outline'}
                          onClick={() => setChartInterval(interval)}
                          size="sm"
                        >
                          {label}
                        </Button>
                      ))}
                    </div>
                  </div>
                </>
              )}
              
              <div className="space-y-2">
                <Label>Search Fields</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search for fields..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="bg-secondary/50 border-border/50 pl-10"
                  />
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Checkbox
                  id="arraysOnly"
                  checked={showArraysOnly}
                  onCheckedChange={(checked) => setShowArraysOnly(checked === true)}
                />
                <Label htmlFor="arraysOnly" className="text-sm text-muted-foreground cursor-pointer">
                  Show arrays only (for table view)
                </Label>
              </div>
              
              <div className="grid grid-cols-2 gap-4 flex-1 overflow-hidden">
                <div className="space-y-2 flex flex-col overflow-hidden">
                  <Label className="text-muted-foreground text-sm">Available Fields</Label>
                  <ScrollArea className="flex-1 border border-border/50 rounded-lg">
                    <div className="p-2 space-y-1">
                      {filteredFields.map((field) => (
                        <button
                          key={field.path}
                          onClick={() => handleFieldToggle(field)}
                          className={cn(
                            "w-full text-left p-2 rounded-md text-sm transition-colors",
                            "hover:bg-secondary/80",
                            selectedFields.find((f) => f.path === field.path) && "bg-primary/20 border border-primary/30"
                          )}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-mono text-xs truncate">{field.path}</span>
                            <span className="text-xs text-muted-foreground shrink-0">{field.type}</span>
                          </div>
                          <div className="text-xs text-muted-foreground truncate mt-0.5">
                            {formatValue(field.value)}
                          </div>
                        </button>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
                
                <div className="space-y-2 flex flex-col overflow-hidden">
                  <Label className="text-muted-foreground text-sm">Selected Fields ({selectedFields.length})</Label>
                  <ScrollArea className="flex-1 border border-border/50 rounded-lg bg-secondary/30">
                    <div className="p-2 space-y-1">
                      {selectedFields.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-8">
                          Click fields to select them
                        </p>
                      ) : (
                        selectedFields.map((field) => (
                          <div
                            key={field.path}
                            className="flex items-center justify-between p-2 rounded-md bg-primary/10 border border-primary/20"
                          >
                            <span className="font-mono text-xs truncate">{field.path}</span>
                            <button
                              onClick={() => setSelectedFields(selectedFields.filter((f) => f.path !== field.path))}
                              className="text-muted-foreground hover:text-foreground"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                  </ScrollArea>
                </div>
              </div>
            </div>
          )}
        </div>
        
        <div className="flex justify-end gap-3 p-6 pt-4 border-t border-border/50">
          <Button variant="ghost" onClick={handleClose}>
            Cancel
          </Button>
          
          {step === 1 ? (
            <Button
              onClick={() => setStep(2)}
              disabled={!name || !apiUrl || !testResult?.success}
            >
              Continue
            </Button>
          ) : (
            <>
              <Button variant="outline" onClick={() => setStep(1)}>
                Back
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={selectedFields.length === 0}
              >
                Add Widget
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
