'use client';

import { useState, useEffect } from 'react';
import { Key, Eye, EyeOff, Plus, Trash2, Check, AlertCircle } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';

interface ApiKey {
  id: string;
  name: string;
  key: string;
  provider: string;
  createdAt: string;
}

interface ApiKeyModalProps {
  open: boolean;
  onClose: () => void;
}

export function ApiKeyModal({ open, onClose }: ApiKeyModalProps) {
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [newKeyName, setNewKeyName] = useState('');
  const [newKeyProvider, setNewKeyProvider] = useState('');
  const [newKeyValue, setNewKeyValue] = useState('');
  const [showKey, setShowKey] = useState<Record<string, boolean>>({});
  const [isAdding, setIsAdding] = useState(false);

  // Load keys from localStorage
  useEffect(() => {
    if (open) {
      const stored = localStorage.getItem('finboard_api_keys');
      if (stored) {
        try {
          setKeys(JSON.parse(stored));
        } catch (error) {
          console.error('Failed to load API keys:', error);
        }
      }
    }
  }, [open]);

  const saveKeys = (updatedKeys: ApiKey[]) => {
    setKeys(updatedKeys);
    localStorage.setItem('finboard_api_keys', JSON.stringify(updatedKeys));
  };

  const handleAddKey = () => {
    if (!newKeyName || !newKeyProvider || !newKeyValue) {
      toast.error('All fields are required');
      return;
    }

    const newKey: ApiKey = {
      id: `key-${Date.now()}`,
      name: newKeyName,
      provider: newKeyProvider,
      key: newKeyValue,
      createdAt: new Date().toISOString(),
    };

    saveKeys([...keys, newKey]);
    
    setNewKeyName('');
    setNewKeyProvider('');
    setNewKeyValue('');
    setIsAdding(false);
    
    toast.success('API key added successfully');
  };

  const handleDeleteKey = (id: string) => {
    saveKeys(keys.filter((k) => k.id !== id));
    toast.success('API key removed');
  };

  const toggleKeyVisibility = (id: string) => {
    setShowKey((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const maskKey = (key: string) => {
    if (key.length <= 8) return '••••••••';
    return key.substring(0, 4) + '••••••••' + key.substring(key.length - 4);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="glass-card max-w-2xl max-h-[85vh] p-0 gap-0 border-border/50">
        <DialogHeader className="p-6 pb-4 border-b border-border/50">
          <DialogTitle className="flex items-center gap-2 text-xl font-semibold">
            <Key className="w-5 h-5 text-primary" />
            API Key Management
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(85vh-140px)]">
          <div className="p-6 space-y-6">
            {/* Info Banner */}
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 flex gap-3">
              <AlertCircle className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="text-sm font-medium text-blue-500">Secure Storage Notice</p>
                <p className="text-xs text-muted-foreground">
                  API keys are stored locally in your browser. For production use, implement server-side key management.
                </p>
              </div>
            </div>

            {/* Existing Keys */}
            {keys.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-sm font-semibold">Saved API Keys ({keys.length})</h3>
                {keys.map((apiKey) => (
                  <div
                    key={apiKey.id}
                    className="bg-secondary/30 border border-border/50 rounded-lg p-4 space-y-3"
                  >
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <p className="font-medium">{apiKey.name}</p>
                        <p className="text-xs text-muted-foreground">{apiKey.provider}</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => handleDeleteKey(apiKey.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Input
                        type={showKey[apiKey.id] ? 'text' : 'password'}
                        value={showKey[apiKey.id] ? apiKey.key : maskKey(apiKey.key)}
                        readOnly
                        className="bg-background/50 border-border/50 font-mono text-xs"
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 flex-shrink-0"
                        onClick={() => toggleKeyVisibility(apiKey.id)}
                      >
                        {showKey[apiKey.id] ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                    
                    <p className="text-xs text-muted-foreground">
                      Added {new Date(apiKey.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>
            )}

            {/* Add New Key */}
            {isAdding ? (
              <div className="space-y-4 bg-secondary/20 border border-border/50 rounded-lg p-4">
                <h3 className="text-sm font-semibold">Add New API Key</h3>
                
                <div className="space-y-2">
                  <Label htmlFor="keyName">Key Name</Label>
                  <Input
                    id="keyName"
                    placeholder="e.g., Alpha Vantage Stock API"
                    value={newKeyName}
                    onChange={(e) => setNewKeyName(e.target.value)}
                    className="bg-background/50 border-border/50"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="provider">Provider</Label>
                  <Input
                    id="provider"
                    placeholder="e.g., Alpha Vantage, Finnhub, CoinGecko"
                    value={newKeyProvider}
                    onChange={(e) => setNewKeyProvider(e.target.value)}
                    className="bg-background/50 border-border/50"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="apiKey">API Key</Label>
                  <Input
                    id="apiKey"
                    type="password"
                    placeholder="Enter your API key"
                    value={newKeyValue}
                    onChange={(e) => setNewKeyValue(e.target.value)}
                    className="bg-background/50 border-border/50 font-mono"
                  />
                </div>
                
                <div className="flex gap-2">
                  <Button
                    onClick={handleAddKey}
                    className="flex-1"
                    disabled={!newKeyName || !newKeyProvider || !newKeyValue}
                  >
                    <Check className="w-4 h-4 mr-2" />
                    Save Key
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsAdding(false);
                      setNewKeyName('');
                      setNewKeyProvider('');
                      setNewKeyValue('');
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <Button
                variant="outline"
                className="w-full border-dashed border-2"
                onClick={() => setIsAdding(true)}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add New API Key
              </Button>
            )}

            {/* Common Providers Guide */}
            <div className="space-y-3 pt-4 border-t border-border/50">
              <h3 className="text-sm font-semibold">Popular API Providers</h3>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="bg-secondary/20 rounded-lg p-3">
                  <p className="font-medium mb-1">Alpha Vantage</p>
                  <a
                    href="https://www.alphavantage.co/support/#api-key"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    Get API Key →
                  </a>
                </div>
                <div className="bg-secondary/20 rounded-lg p-3">
                  <p className="font-medium mb-1">Finnhub</p>
                  <a
                    href="https://finnhub.io/register"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    Get API Key →
                  </a>
                </div>
                <div className="bg-secondary/20 rounded-lg p-3">
                  <p className="font-medium mb-1">CoinGecko</p>
                  <a
                    href="https://www.coingecko.com/en/api"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    Get API Key →
                  </a>
                </div>
                <div className="bg-secondary/20 rounded-lg p-3">
                  <p className="font-medium mb-1">Polygon.io</p>
                  <a
                    href="https://polygon.io/dashboard/signup"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    Get API Key →
                  </a>
                </div>
              </div>
            </div>
          </div>
        </ScrollArea>

        <div className="p-6 pt-4 border-t border-border/50">
          <Button onClick={onClose} className="w-full">
            Done
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
