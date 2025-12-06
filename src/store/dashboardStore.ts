import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type DisplayMode = 'card' | 'table' | 'chart';
export type ChartType = 'line' | 'candlestick';
export type ChartInterval = 'daily' | 'weekly' | 'monthly';
export type ConnectionType = 'http' | 'websocket';
export type WebSocketStatus = 'connecting' | 'connected' | 'disconnected' | 'error';

export interface WidgetField {
  path: string;
  label: string;
  type: string;
  value?: unknown;
}

export interface Widget {
  id: string;
  name: string;
  apiUrl: string;
  connectionType: ConnectionType;
  websocketStatus?: WebSocketStatus;
  refreshInterval: number;
  displayMode: DisplayMode;
  chartType: ChartType;
  chartInterval: ChartInterval;
  selectedFields: WidgetField[];
  data: unknown | null;
  lastUpdated: string | null;
  isLoading: boolean;
  error: string | null;
  order: number;
}

export interface DashboardExport {
  version: string;
  exportedAt: string;
  widgets: Omit<Widget, 'data' | 'lastUpdated' | 'isLoading' | 'error' | 'websocketStatus'>[];
}

interface DashboardState {
  widgets: Widget[];
  addWidget: (widget: Omit<Widget, 'id' | 'data' | 'lastUpdated' | 'isLoading' | 'error' | 'order' | 'websocketStatus'>) => void;
  removeWidget: (id: string) => void;
  updateWidget: (id: string, updates: Partial<Widget>) => void;
  reorderWidgets: (activeId: string, overId: string) => void;
  setWidgetData: (id: string, data: unknown) => void;
  setWidgetLoading: (id: string, isLoading: boolean) => void;
  setWidgetError: (id: string, error: string | null) => void;
  setWebSocketStatus: (id: string, status: WebSocketStatus) => void;
  exportDashboard: () => DashboardExport;
  importDashboard: (data: DashboardExport, mode: 'replace' | 'merge') => { success: boolean; message: string };
  clearAllWidgets: () => void;
}

export const useDashboardStore = create<DashboardState>()(
  persist(
    (set, get) => ({
      widgets: [],
      
      addWidget: (widgetData) => {
        const id = `widget-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const order = get().widgets.length;
        
        set((state) => ({
          widgets: [
            ...state.widgets,
            {
              ...widgetData,
              id,
              order,
              data: null,
              lastUpdated: null,
              isLoading: false,
              error: null,
            },
          ],
        }));
      },
      
      removeWidget: (id) => {
        set((state) => ({
          widgets: state.widgets
            .filter((w) => w.id !== id)
            .map((w, index) => ({ ...w, order: index })),
        }));
      },
      
      updateWidget: (id, updates) => {
        set((state) => ({
          widgets: state.widgets.map((w) =>
            w.id === id ? { ...w, ...updates } : w
          ),
        }));
      },
      
      reorderWidgets: (activeId, overId) => {
        set((state) => {
          const oldIndex = state.widgets.findIndex((w) => w.id === activeId);
          const newIndex = state.widgets.findIndex((w) => w.id === overId);
          
          if (oldIndex === -1 || newIndex === -1) return state;
          
          const newWidgets = [...state.widgets];
          const [movedWidget] = newWidgets.splice(oldIndex, 1);
          newWidgets.splice(newIndex, 0, movedWidget);
          
          return {
            widgets: newWidgets.map((w, index) => ({ ...w, order: index })),
          };
        });
      },
      
      setWidgetData: (id, data) => {
        set((state) => ({
          widgets: state.widgets.map((w) =>
            w.id === id
              ? { ...w, data, lastUpdated: new Date().toLocaleTimeString(), error: null }
              : w
          ),
        }));
      },
      
      setWidgetLoading: (id, isLoading) => {
        set((state) => ({
          widgets: state.widgets.map((w) =>
            w.id === id ? { ...w, isLoading } : w
          ),
        }));
      },
      
      setWidgetError: (id, error) => {
        set((state) => ({
          widgets: state.widgets.map((w) =>
            w.id === id ? { ...w, error, isLoading: false } : w
          ),
        }));
      },

      setWebSocketStatus: (id, websocketStatus) => {
        set((state) => ({
          widgets: state.widgets.map((w) =>
            w.id === id ? { ...w, websocketStatus } : w
          ),
        }));
      },

      exportDashboard: () => {
        const state = get();
        return {
          version: '1.0.0',
          exportedAt: new Date().toISOString(),
          widgets: state.widgets.map((w) => ({
            id: w.id,
            name: w.name,
            apiUrl: w.apiUrl,
            connectionType: w.connectionType,
            refreshInterval: w.refreshInterval,
            displayMode: w.displayMode,
            chartType: w.chartType,
            chartInterval: w.chartInterval,
            selectedFields: w.selectedFields,
            order: w.order,
          })),
        };
      },

      importDashboard: (data, mode) => {
        try {
          if (!data.version || !data.widgets || !Array.isArray(data.widgets)) {
            return { success: false, message: 'Invalid dashboard file format' };
          }

          const importedWidgets: Widget[] = data.widgets.map((w, index) => ({
            ...w,
            id: mode === 'replace' ? w.id : `widget-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            order: mode === 'replace' ? w.order : get().widgets.length + index,
            data: null,
            lastUpdated: null,
            isLoading: false,
            error: null,
          }));

          if (mode === 'replace') {
            set({ widgets: importedWidgets });
          } else {
            set((state) => ({
              widgets: [...state.widgets, ...importedWidgets],
            }));
          }

          return { 
            success: true, 
            message: `Successfully imported ${importedWidgets.length} widget(s)` 
          };
        } catch {
          return { success: false, message: 'Failed to parse dashboard file' };
        }
      },

      clearAllWidgets: () => {
        set({ widgets: [] });
      },
    }),
    {
      name: 'finboard-dashboard',
      partialize: (state) => ({
        widgets: state.widgets.map((w) => ({
          ...w,
          data: null,
          isLoading: false,
          error: null,
          lastUpdated: null,
        })),
      }),
    }
  )
);
