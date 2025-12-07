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
        <div className="container mx-auto px-3 sm:px-4 py-3 sm:py-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <div className="p-1.5 sm:p-2 rounded-lg bg-primary/10 border border-primary/20 shrink-0">
                <Activity className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
              </div>
              <div className="min-w-0">
                <h1 className="text-base sm:text-xl font-bold truncate">Finance Dashboard</h1>
                <p className="text-xs sm:text-sm text-muted-foreground hidden xs:block">
                  {widgets.length} widget{widgets.length !== 1 ? 's' : ''} • Real-time
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-1 sm:gap-2 shrink-0">
              <ThemeToggle />
              <Button variant="outline" size="icon" onClick={() => setIsCacheStatsOpen(true)} className="hidden md:flex h-9 w-9" title="Cache Statistics">
                <BarChart3 className="w-4 h-4" />
              </Button>
              <Button variant="outline" size="icon" onClick={() => setIsApiKeyModalOpen(true)} className="hidden md:flex h-9 w-9" title="API Keys">
                <Key className="w-4 h-4" />
              </Button>
              <Button variant="outline" onClick={() => setIsExportImportOpen(true)} className="gap-1.5 h-9 px-2 sm:px-4">
                <FileJson className="w-4 h-4" />
                <span className="hidden lg:inline">Export/Import</span>
              </Button>
              <Button variant="outline" onClick={() => setIsTemplatesOpen(true)} className="gap-1.5 h-9 px-2 sm:px-4">
                <Sparkles className="w-4 h-4" />
                <span className="hidden lg:inline">Templates</span>
              </Button>
              <Button onClick={() => setIsModalOpen(true)} className="gap-1.5 h-9 px-2 sm:px-4">
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">Add Widget</span>
              </Button>
            </div>
          </div>
        </div>
      </header>
      
      {/* Main Content */}
      <main className="container mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6">
        {widgets.length === 0 ? (
          <div className="flex flex-col items-center justify-center min-h-[50vh] sm:min-h-[60vh] text-center px-4">
            <div className="p-4 sm:p-6 rounded-2xl bg-secondary/30 border border-border/50 mb-4 sm:mb-6">
              <LayoutGrid className="w-12 h-12 sm:w-16 sm:h-16 text-muted-foreground" />
            </div>
            <h2 className="text-xl sm:text-2xl font-semibold mb-2">Build Your Finance Dashboard</h2>
            <p className="text-sm sm:text-base text-muted-foreground max-w-md mb-4 sm:mb-6">
              Create custom widgets by connecting to any finance API. Track stocks, crypto, 
              market data, and more in real-time.
            </p>
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full sm:w-auto">
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
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
                {sortedWidgets.map((widget) => (
                  <WidgetCard key={widget.id} widget={widget} onEdit={handleEditWidget} />
                ))}
                
                {/* Add Widget Card */}
                <button
                  onClick={() => setIsModalOpen(true)}
                  className="glass-card p-4 sm:p-6 border-dashed border-2 border-border/50 hover:border-primary/50 
                           flex flex-col items-center justify-center gap-2 sm:gap-3 min-h-[180px] sm:min-h-[200px] 
                           transition-all duration-300 hover:bg-primary/5 group"
                >
                  <div className="p-2 sm:p-3 rounded-full bg-secondary/50 group-hover:bg-primary/10 transition-colors">
                    <Plus className="w-5 h-5 sm:w-6 sm:h-6 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                  <p className="text-xs sm:text-sm text-muted-foreground group-hover:text-foreground transition-colors text-center px-2">
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
