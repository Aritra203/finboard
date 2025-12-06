'use client';

import { useState } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
} from '@dnd-kit/sortable';
import { Plus, LayoutGrid, Activity, Sparkles, FileJson, Key, BarChart3 } from 'lucide-react';
import { useDashboardStore, Widget } from '@/store/dashboardStore';
import { WidgetCard } from './WidgetCard';
import { AddWidgetModal } from './AddWidgetModal';
import { EditWidgetModal } from './EditWidgetModal';
import { TemplatesModal } from './TemplatesModal';
import { ExportImportModal } from './ExportImportModal';
import { ApiKeyModal } from './ApiKeyModal';
import { CacheStatsModal } from './CacheStatsModal';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/ThemeToggle';

export function Dashboard() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isTemplatesOpen, setIsTemplatesOpen] = useState(false);
  const [isExportImportOpen, setIsExportImportOpen] = useState(false);
  const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState(false);
  const [isCacheStatsOpen, setIsCacheStatsOpen] = useState(false);
  const [editingWidget, setEditingWidget] = useState<Widget | null>(null);
  const { widgets, reorderWidgets } = useDashboardStore();
  
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );
  
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      reorderWidgets(active.id as string, over.id as string);
    }
  };

  const handleEditWidget = (widget: Widget) => {
    setEditingWidget(widget);
  };

  const handleCloseEdit = () => {
    setEditingWidget(null);
  };
  
  const sortedWidgets = [...widgets].sort((a, b) => a.order - b.order);
  
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-xl sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10 border border-primary/20">
                <Activity className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h1 className="text-xl font-bold">Finance Dashboard</h1>
                <p className="text-sm text-muted-foreground">
                  {widgets.length} active widget{widgets.length !== 1 ? 's' : ''} • Real-time data
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <Button variant="outline" size="icon" onClick={() => setIsCacheStatsOpen(true)} className="hidden sm:flex" title="Cache Statistics">
                <BarChart3 className="w-4 h-4" />
              </Button>
              <Button variant="outline" size="icon" onClick={() => setIsApiKeyModalOpen(true)} className="hidden sm:flex" title="API Keys">
                <Key className="w-4 h-4" />
              </Button>
              <Button variant="outline" onClick={() => setIsExportImportOpen(true)} className="gap-2">
                <FileJson className="w-4 h-4" />
                <span className="hidden sm:inline">Export/Import</span>
              </Button>
              <Button variant="outline" onClick={() => setIsTemplatesOpen(true)} className="gap-2">
                <Sparkles className="w-4 h-4" />
                <span className="hidden sm:inline">Templates</span>
              </Button>
              <Button onClick={() => setIsModalOpen(true)} className="gap-2">
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">Add Widget</span>
              </Button>
            </div>
          </div>
        </div>
      </header>
      
      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        {widgets.length === 0 ? (
          <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
            <div className="p-6 rounded-2xl bg-secondary/30 border border-border/50 mb-6">
              <LayoutGrid className="w-16 h-16 text-muted-foreground" />
            </div>
            <h2 className="text-2xl font-semibold mb-2">Build Your Finance Dashboard</h2>
            <p className="text-muted-foreground max-w-md mb-6">
              Create custom widgets by connecting to any finance API. Track stocks, crypto, 
              market data, and more in real-time.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button variant="outline" onClick={() => setIsTemplatesOpen(true)} size="lg" className="gap-2">
                <Sparkles className="w-5 h-5" />
                Use a Template
              </Button>
              <Button onClick={() => setIsModalOpen(true)} size="lg" className="gap-2">
                <Plus className="w-5 h-5" />
                Add Custom Widget
              </Button>
            </div>
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={sortedWidgets.map((w) => w.id)}
              strategy={rectSortingStrategy}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {sortedWidgets.map((widget) => (
                  <WidgetCard key={widget.id} widget={widget} onEdit={handleEditWidget} />
                ))}
                
                {/* Add Widget Card */}
                <button
                  onClick={() => setIsModalOpen(true)}
                  className="glass-card p-6 border-dashed border-2 border-border/50 hover:border-primary/50 
                           flex flex-col items-center justify-center gap-3 min-h-[200px] 
                           transition-all duration-300 hover:bg-primary/5 group"
                >
                  <div className="p-3 rounded-full bg-secondary/50 group-hover:bg-primary/10 transition-colors">
                    <Plus className="w-6 h-6 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                  <p className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">
                    Connect to a finance API and create a custom widget
                  </p>
                </button>
              </div>
            </SortableContext>
          </DndContext>
        )}
      </main>
      
      <AddWidgetModal open={isModalOpen} onClose={() => setIsModalOpen(false)} />
      <EditWidgetModal open={!!editingWidget} onClose={handleCloseEdit} widget={editingWidget} />
      <TemplatesModal open={isTemplatesOpen} onClose={() => setIsTemplatesOpen(false)} />
      <ExportImportModal open={isExportImportOpen} onClose={() => setIsExportImportOpen(false)} />
      <ApiKeyModal open={isApiKeyModalOpen} onClose={() => setIsApiKeyModalOpen(false)} />
      <CacheStatsModal open={isCacheStatsOpen} onClose={() => setIsCacheStatsOpen(false)} />
    </div>
  );
}
