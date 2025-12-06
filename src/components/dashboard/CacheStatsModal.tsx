'use client';

import { useState, useEffect } from 'react';
import { BarChart3, Database, AlertTriangle, RefreshCw, Trash2, Clock } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { apiCache } from '@/lib/cache';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

interface CacheStatsModalProps {
  open: boolean;
  onClose: () => void;
}

export function CacheStatsModal({ open, onClose }: CacheStatsModalProps) {
  const [stats, setStats] = useState<{ cacheSize: number; rateLimitedDomains: string[] }>({
    cacheSize: 0,
    rateLimitedDomains: [],
  });
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    if (open) {
      updateStats();
    }
  }, [open, refreshKey]);

  const updateStats = () => {
    const currentStats = apiCache.getStats();
    setStats(currentStats);
  };

  const handleClearCache = () => {
    apiCache.clear();
    updateStats();
    toast.success('Cache cleared successfully');
  };

  const handleClearRateLimit = (domain: string) => {
    // Create a dummy URL to clear the rate limit
    apiCache.clearRateLimit(`https://${domain}`);
    updateStats();
    toast.success(`Rate limit cleared for ${domain}`);
  };

  const handleCleanup = () => {
    apiCache.cleanup();
    updateStats();
    toast.success('Expired entries cleaned up');
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="glass-card max-w-2xl max-h-[85vh] p-0 gap-0 border-border/50">
        <DialogHeader className="p-6 pb-4 border-b border-border/50">
          <DialogTitle className="flex items-center gap-2 text-xl font-semibold">
            <BarChart3 className="w-5 h-5 text-primary" />
            Cache Statistics
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(85vh-140px)]">
          <div className="p-6 space-y-6">
            {/* Overview Cards */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gradient-to-br from-blue-500/10 to-blue-600/10 border border-blue-500/20 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <Database className="w-5 h-5 text-blue-500" />
                  <Badge variant="secondary" className="bg-blue-500/20 text-blue-500 border-blue-500/30">
                    Active
                  </Badge>
                </div>
                <p className="text-2xl font-bold text-blue-500">{stats.cacheSize}</p>
                <p className="text-xs text-muted-foreground mt-1">Cached Responses</p>
              </div>

              <div className="bg-gradient-to-br from-orange-500/10 to-orange-600/10 border border-orange-500/20 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <AlertTriangle className="w-5 h-5 text-orange-500" />
                  <Badge variant="secondary" className="bg-orange-500/20 text-orange-500 border-orange-500/30">
                    Limited
                  </Badge>
                </div>
                <p className="text-2xl font-bold text-orange-500">{stats.rateLimitedDomains.length}</p>
                <p className="text-xs text-muted-foreground mt-1">Rate Limited Domains</p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleCleanup}
                className="flex-1 gap-2"
              >
                <Clock className="w-4 h-4" />
                Clean Expired
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleClearCache}
                className="flex-1 gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Clear All Cache
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  updateStats();
                  setRefreshKey((k) => k + 1);
                }}
                className="gap-2"
              >
                <RefreshCw className="w-4 h-4" />
              </Button>
            </div>

            {/* Cache Info */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold">How Caching Works</h3>
              <div className="bg-secondary/20 border border-border/50 rounded-lg p-4 space-y-2 text-xs text-muted-foreground">
                <p>• API responses are cached for 30 seconds by default</p>
                <p>• Each widget can configure its own cache TTL</p>
                <p>• Cache reduces API calls and improves performance</p>
                <p>• Expired entries are automatically cleaned up every 5 minutes</p>
              </div>
            </div>

            {/* Rate Limited Domains */}
            {stats.rateLimitedDomains.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-sm font-semibold flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-orange-500" />
                  Rate Limited Domains ({stats.rateLimitedDomains.length})
                </h3>
                <div className="space-y-2">
                  {stats.rateLimitedDomains.map((domain) => (
                    <div
                      key={domain}
                      className="bg-secondary/30 border border-orange-500/20 rounded-lg p-3 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-orange-500 flex-shrink-0" />
                        <div>
                          <p className="text-sm font-medium">{domain}</p>
                          <p className="text-xs text-muted-foreground">
                            Temporarily blocked due to rate limiting
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleClearRateLimit(domain)}
                        className="text-orange-500 hover:text-orange-600"
                      >
                        Clear
                      </Button>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">
                  Note: Clearing a rate limit manually might result in further rate limiting if the API still enforces limits.
                </p>
              </div>
            )}

            {stats.rateLimitedDomains.length === 0 && (
              <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-4 flex items-center gap-3">
                <div className="p-2 rounded-full bg-emerald-500/20">
                  <Database className="w-5 h-5 text-emerald-500" />
                </div>
                <div>
                  <p className="text-sm font-medium text-emerald-500">All APIs Running Smoothly</p>
                  <p className="text-xs text-muted-foreground">No rate-limited domains detected</p>
                </div>
              </div>
            )}

            {/* Performance Tips */}
            <div className="space-y-3 pt-4 border-t border-border/50">
              <h3 className="text-sm font-semibold">Performance Tips</h3>
              <div className="space-y-2 text-xs">
                <div className="bg-secondary/20 rounded-lg p-3">
                  <p className="font-medium mb-1">Increase Refresh Intervals</p>
                  <p className="text-muted-foreground">
                    Use longer refresh intervals (60s+) for widgets that don't need real-time updates
                  </p>
                </div>
                <div className="bg-secondary/20 rounded-lg p-3">
                  <p className="font-medium mb-1">Monitor Rate Limits</p>
                  <p className="text-muted-foreground">
                    Check your API provider's rate limits and adjust widget refresh rates accordingly
                  </p>
                </div>
                <div className="bg-secondary/20 rounded-lg p-3">
                  <p className="font-medium mb-1">Use Caching Wisely</p>
                  <p className="text-muted-foreground">
                    Cache helps reduce API calls, but you can manually refresh widgets when needed
                  </p>
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
