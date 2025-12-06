'use client';

import { Bitcoin, DollarSign, Coins, ArrowRight, Sparkles } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useDashboardStore } from '@/store/dashboardStore';
import { dashboardTemplates, DashboardTemplate } from '@/data/templates';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface TemplatesModalProps {
  open: boolean;
  onClose: () => void;
}

const iconMap: Record<string, React.ElementType> = {
  Bitcoin,
  DollarSign,
  Coins,
};

export function TemplatesModal({ open, onClose }: TemplatesModalProps) {
  const { widgets, addWidget } = useDashboardStore();

  const handleApplyTemplate = (template: DashboardTemplate) => {
    template.widgets.forEach((widgetTemplate) => {
      addWidget({
        name: widgetTemplate.name,
        apiUrl: widgetTemplate.apiUrl,
        refreshInterval: widgetTemplate.refreshInterval,
        displayMode: widgetTemplate.displayMode,
        chartType: widgetTemplate.chartType,
        chartInterval: widgetTemplate.chartInterval,
        selectedFields: widgetTemplate.selectedFields,
        connectionType: 'http',
      });
    });

    toast.success(`${template.name} template applied!`, {
      description: `Added ${template.widgets.length} widgets to your dashboard.`,
    });

    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="glass-card max-w-2xl p-0 gap-0 border-border/50">
        <DialogHeader className="p-6 pb-4 border-b border-border/50">
          <DialogTitle className="flex items-center gap-2 text-xl font-semibold">
            <Sparkles className="w-5 h-5 text-primary" />
            Dashboard Templates
          </DialogTitle>
          <p className="text-sm text-muted-foreground mt-1">
            Get started quickly with pre-configured widget sets
          </p>
        </DialogHeader>

        <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto scrollbar-thin">
          {dashboardTemplates.map((template) => {
            const Icon = iconMap[template.icon] || Bitcoin;
            
            return (
              <div
                key={template.id}
                className="group relative p-4 rounded-xl border border-border/50 bg-secondary/20 
                         hover:bg-secondary/40 hover:border-primary/30 transition-all duration-300"
              >
                <div className="flex items-start gap-4">
                  <div
                    className={cn(
                      "p-3 rounded-xl bg-gradient-to-br shrink-0",
                      template.color
                    )}
                  >
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-base mb-1">{template.name}</h3>
                    <p className="text-sm text-muted-foreground mb-3">
                      {template.description}
                    </p>
                    
                    <div className="flex flex-wrap gap-2">
                      {template.widgets.map((widget, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 text-xs rounded-md bg-background/50 border border-border/50"
                        >
                          {widget.name}
                        </span>
                      ))}
                    </div>
                  </div>
                  
                  <Button
                    onClick={() => handleApplyTemplate(template)}
                    size="sm"
                    className="shrink-0 gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    Apply
                    <ArrowRight className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>

        <div className="p-4 border-t border-border/50 bg-muted/30">
          <p className="text-xs text-muted-foreground text-center">
            Templates add widgets to your existing dashboard. You can remove or customize them afterwards.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
