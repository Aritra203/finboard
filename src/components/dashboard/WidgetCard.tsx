'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, RefreshCw, Trash2, Settings, AlertCircle, Loader2, Pencil, Search, ChevronLeft, ChevronRight, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { Widget, useDashboardStore, ChartType, ChartInterval } from '@/store/dashboardStore';
import { getValueByPath, formatValue, fetchWithCache } from '@/lib/apiUtils';
import { wsPool, isWebSocketURL } from '@/lib/websocket';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  BarChart,
  Bar,
  ComposedChart,
  ReferenceLine,
} from 'recharts';

interface WidgetCardProps {
  widget: Widget;
  onEdit: (widget: Widget) => void;
}

interface CandlestickData {
  name: string;
  open: number;
  high: number;
  low: number;
  close: number;
}

interface CandlestickProps {
  x: number;
  y: number;
  width: number;
  height: number;
  open: number;
  close: number;
  high: number;
  low: number;
}

const Candlestick = (props: CandlestickProps) => {
  const { x, y, width, height, open, close, high, low } = props;
  const isGreen = close >= open;
  const color = isGreen ? 'hsl(var(--success))' : 'hsl(var(--destructive))';
  const bodyY = Math.min(open, close);
  const bodyHeight = Math.abs(close - open);
  
  return (
    <g>
      <line
        x1={x + width / 2}
        y1={high}
        x2={x + width / 2}
        y2={low}
        stroke={color}
        strokeWidth={1}
      />
      <rect
        x={x}
        y={bodyY}
        width={width}
        height={Math.max(bodyHeight, 1)}
        fill={isGreen ? color : color}
        stroke={color}
      />
    </g>
  );
};

export function WidgetCard({ widget, onEdit }: WidgetCardProps) {
  const { removeWidget, setWidgetData, setWidgetLoading, setWidgetError, updateWidget, setWebSocketStatus } = useDashboardStore();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const wsManagerRef = useRef<ReturnType<typeof wsPool.get> | null>(null);
  
  const [tableSearch, setTableSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const itemsPerPage = 5;
  
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: widget.id });
  
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };
  
  const fetchData = useCallback(async (skipCache: boolean = false) => {
    setWidgetLoading(widget.id, true);
    
    const result = await fetchWithCache(widget.apiUrl, {
      useCache: !skipCache,
      cacheTTL: widget.refreshInterval * 1000,
      retryOnRateLimit: false,
      maxRetries: 2,
    });

    if (result.success && result.data) {
      setWidgetData(widget.id, result.data);
    } else if (result.rateLimited) {
      setWidgetError(widget.id, `Rate limited. Retry in ${result.retryAfter}s`);
    } else {
      setWidgetError(widget.id, result.error || 'Failed to fetch data');
    }
    
    setWidgetLoading(widget.id, false);
  }, [widget.id, widget.apiUrl, widget.refreshInterval, setWidgetLoading, setWidgetData, setWidgetError]);

  const setupWebSocket = useCallback(() => {
    if (widget.connectionType !== 'websocket' || !isWebSocketURL(widget.apiUrl)) return;

    setWidgetLoading(widget.id, true);
    setWebSocketStatus(widget.id, 'connecting');

    wsManagerRef.current = wsPool.connect(widget.id, {
      url: widget.apiUrl,
      onMessage: (data) => {
        setWidgetData(widget.id, data);
        setWidgetLoading(widget.id, false);
      },
      onStatusChange: (status) => {
        setWebSocketStatus(widget.id, status);
        if (status === 'connected') {
          setWidgetError(widget.id, null);
          setWidgetLoading(widget.id, false);
        } else if (status === 'error') {
          setWidgetError(widget.id, 'WebSocket connection failed');
          setWidgetLoading(widget.id, false);
        }
      },
      onError: (error) => {
        console.error('[Widget] WebSocket error:', error);
        setWidgetError(widget.id, 'WebSocket error occurred');
        setWidgetLoading(widget.id, false);
      },
    });
  }, [widget.id, widget.apiUrl, widget.connectionType, setWidgetLoading, setWebSocketStatus, setWidgetData, setWidgetError]);

  const cleanup = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (wsManagerRef.current) {
      wsPool.disconnect(widget.id);
      wsManagerRef.current = null;
    }
  }, [widget.id]);
  
  useEffect(() => {
    cleanup();

    if (widget.connectionType === 'websocket') {
      setupWebSocket();
    } else {
      fetchData();
      intervalRef.current = setInterval(fetchData, widget.refreshInterval * 1000);
    }

    return () => cleanup();
  }, [widget.apiUrl, widget.refreshInterval, widget.connectionType, setupWebSocket, fetchData, cleanup]);

  useEffect(() => {
    setCurrentPage(1);
  }, [tableSearch]);

  const handleChartTypeChange = (chartType: ChartType) => {
    updateWidget(widget.id, { chartType });
  };

  const handleChartIntervalChange = (chartInterval: ChartInterval) => {
    updateWidget(widget.id, { chartInterval });
  };
  
  const renderCardView = () => {
    if (!widget.data) return null;
    
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {widget.selectedFields.map((field) => {
          const value = getValueByPath(widget.data, field.path);
          return (
            <div key={field.path} className="p-3 bg-secondary/30 rounded-lg">
              <p className="text-xs text-muted-foreground capitalize mb-1">
                {field.label.replace(/[._]/g, ' ')}
              </p>
              <p className="text-sm font-mono font-medium truncate">
                {formatValue(value)}
              </p>
            </div>
          );
        })}
      </div>
    );
  };
  
  const renderTableView = () => {
    if (!widget.data) return null;
    
    // Find the first array field in selected fields
    const arrayField = widget.selectedFields.find((f) => f.type === 'array');
    let tableData: Record<string, unknown>[] = [];
    
    if (arrayField) {
      const rawData = getValueByPath(widget.data, arrayField.path);
      if (Array.isArray(rawData)) {
        tableData = rawData;
      }
    } else {
      // Create single row from selected fields
      const row: Record<string, unknown> = {};
      widget.selectedFields.forEach((field) => {
        row[field.label] = getValueByPath(widget.data, field.path);
      });
      tableData = [row];
    }
    
    if (tableData.length === 0) return <p className="text-muted-foreground text-sm">No data available</p>;
    
    const columns = Object.keys(tableData[0] || {}).slice(0, 5);
    
    const filteredData = tableSearch
      ? tableData.filter((row) =>
          columns.some((col) =>
            String(row[col]).toLowerCase().includes(tableSearch.toLowerCase())
          )
        )
      : tableData;
    
    // Sort data
    const sortedData = sortColumn
      ? [...filteredData].sort((a, b) => {
          const aVal = a[sortColumn];
          const bVal = b[sortColumn];
          
          // Handle numbers
          const aNum = Number(aVal);
          const bNum = Number(bVal);
          if (!isNaN(aNum) && !isNaN(bNum)) {
            return sortDirection === 'asc' ? aNum - bNum : bNum - aNum;
          }
          
          // Handle strings
          const aStr = String(aVal).toLowerCase();
          const bStr = String(bVal).toLowerCase();
          if (sortDirection === 'asc') {
            return aStr < bStr ? -1 : aStr > bStr ? 1 : 0;
          } else {
            return bStr < aStr ? -1 : bStr > aStr ? 1 : 0;
          }
        })
      : filteredData;
    
    const handleSort = (column: string) => {
      if (sortColumn === column) {
        setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
      } else {
        setSortColumn(column);
        setSortDirection('asc');
      }
    };
    
    const totalPages = Math.ceil(sortedData.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedData = sortedData.slice(startIndex, startIndex + itemsPerPage);
    
    return (
      <div className="space-y-3">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground" />
          <Input
            placeholder="Search..."
            value={tableSearch}
            onChange={(e) => setTableSearch(e.target.value)}
            className="h-8 pl-7 text-xs bg-secondary/30 border-border/50"
          />
        </div>
        
        {/* Table */}
        <div className="overflow-x-auto scrollbar-thin">
          <Table>
            <TableHeader>
              <TableRow className="border-border/50">
                {columns.map((col) => (
                  <TableHead 
                    key={col} 
                    className="text-xs capitalize cursor-pointer hover:bg-secondary/30 select-none"
                    onClick={() => handleSort(col)}
                  >
                    <div className="flex items-center gap-1">
                      {col.replace(/[._]/g, ' ')}
                      {sortColumn === col ? (
                        sortDirection === 'asc' ? (
                          <ArrowUp className="w-3 h-3" />
                        ) : (
                          <ArrowDown className="w-3 h-3" />
                        )
                      ) : (
                        <ArrowUpDown className="w-3 h-3 opacity-30" />
                      )}
                    </div>
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedData.map((row, i) => (
                <TableRow key={i} className="border-border/30">
                  {columns.map((col) => (
                    <TableCell key={col} className="text-sm font-mono py-2">
                      {formatValue(row[col])}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        
        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>
              {startIndex + 1}-{Math.min(startIndex + itemsPerPage, sortedData.length)} of {sortedData.length}
            </span>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="w-3 h-3" />
              </Button>
              <span>{currentPage} / {totalPages}</span>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
              >
                <ChevronRight className="w-3 h-3" />
              </Button>
            </div>
          </div>
        )}
      </div>
    );
  };
  
  const renderChartView = () => {
    if (!widget.data) return null;
    
    const chartType = widget.chartType || 'line';
    const chartInterval = widget.chartInterval || 'daily';
    
    const numericFields = widget.selectedFields.filter(
      (f) => f.type === 'number' || f.type === 'string'
    );
    
    if (numericFields.length === 0) {
      return <p className="text-muted-foreground text-sm">No numeric data for chart</p>;
    }
    
    const chartData = numericFields.slice(0, 6).map((field, index) => {
      const value = getValueByPath(widget.data, field.path);
      const numValue = typeof value === 'number' ? value : parseFloat(String(value)) || 0;
      
      const variance = numValue * 0.02;
      return {
        name: field.label.slice(0, 10),
        value: numValue,
        open: numValue - variance * (Math.random() - 0.5),
        high: numValue + variance * Math.random(),
        low: numValue - variance * Math.random(),
        close: numValue + variance * (Math.random() - 0.5),
      };
    });

    const intervals: { value: ChartInterval; label: string }[] = [
      { value: 'daily', label: 'D' },
      { value: 'weekly', label: 'W' },
      { value: 'monthly', label: 'M' },
    ];
    
    return (
      <div className="space-y-2">
        {/* Chart Controls */}
        <div className="flex items-center justify-between">
          <div className="flex gap-1">
            <Button
              variant={chartType === 'line' ? 'default' : 'ghost'}
              size="sm"
              className="h-6 px-2 text-xs"
              onClick={() => handleChartTypeChange('line')}
            >
              Line
            </Button>
            <Button
              variant={chartType === 'candlestick' ? 'default' : 'ghost'}
              size="sm"
              className="h-6 px-2 text-xs"
              onClick={() => handleChartTypeChange('candlestick')}
            >
              Candle
            </Button>
          </div>
          <div className="flex gap-1">
            {intervals.map(({ value, label }) => (
              <Button
                key={value}
                variant={chartInterval === value ? 'default' : 'ghost'}
                size="sm"
                className="h-6 w-6 p-0 text-xs"
                onClick={() => handleChartIntervalChange(value)}
              >
                {label}
              </Button>
            ))}
          </div>
        </div>

        {/* Chart */}
        <div className="h-44 w-full">
          <ResponsiveContainer width="100%" height="100%">
            {chartType === 'candlestick' ? (
              <ComposedChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis 
                  dataKey="name" 
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
                  axisLine={{ stroke: 'hsl(var(--border))' }}
                />
                <YAxis 
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
                  axisLine={{ stroke: 'hsl(var(--border))' }}
                  domain={['auto', 'auto']}
                />
                <Tooltip 
                  contentStyle={{ 
                    background: 'hsl(var(--popover))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                  labelStyle={{ color: 'hsl(var(--foreground))' }}
                  formatter={(value: number, name: string) => [value.toFixed(4), name]}
                />
                <Bar
                  dataKey="close"
                  fill="hsl(var(--primary))"
                  shape={(props: { x: number; y: number; width: number; height: number; payload: CandlestickData; background?: { height: number } }) => {
                    const { x, y, width, height, payload } = props;
                    const yScale = props.background?.height / (Math.max(...chartData.map(d => d.high)) - Math.min(...chartData.map(d => d.low))) || 1;
                    return (
                      <Candlestick
                        x={x}
                        y={y}
                        width={width}
                        height={height}
                        open={payload.open}
                        close={payload.close}
                        high={payload.high}
                        low={payload.low}
                      />
                    );
                  }}
                />
              </ComposedChart>
            ) : (
              <LineChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis 
                  dataKey="name" 
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
                  axisLine={{ stroke: 'hsl(var(--border))' }}
                />
                <YAxis 
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
                  axisLine={{ stroke: 'hsl(var(--border))' }}
                />
                <Tooltip 
                  contentStyle={{ 
                    background: 'hsl(var(--popover))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                  labelStyle={{ color: 'hsl(var(--foreground))' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="value" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={2}
                  dot={{ fill: 'hsl(var(--primary))', strokeWidth: 0 }}
                  activeDot={{ r: 6, fill: 'hsl(var(--primary))' }}
                />
              </LineChart>
            )}
          </ResponsiveContainer>
        </div>
      </div>
    );
  };
  
  const renderContent = () => {
    if (widget.isLoading && !widget.data) {
      return (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      );
    }
    
    if (widget.error) {
      const isRateLimited = widget.error.includes('Rate limited');
      const retryMatch = widget.error.match(/Retry in (\d+)s/);
      const retrySeconds = retryMatch ? parseInt(retryMatch[1]) : null;
      
      return (
        <div className="flex flex-col items-center justify-center py-8">
          <div className={cn(
            "p-3 rounded-full mb-3",
            isRateLimited ? "bg-orange-500/10" : "bg-destructive/10"
          )}>
            <AlertCircle className={cn(
              "w-8 h-8",
              isRateLimited ? "text-orange-500" : "text-destructive"
            )} />
          </div>
          <p className="text-sm font-medium mb-1">
            {isRateLimited ? 'Rate Limited' : 'Failed to Load'}
          </p>
          <p className="text-xs text-muted-foreground text-center max-w-[240px] mb-3">
            {widget.error}
          </p>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => fetchData(true)} 
              disabled={widget.isLoading}
            >
              {widget.isLoading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4 mr-2" />
              )}
              Retry Now
            </Button>
            {retrySeconds && retrySeconds > 5 && (
              <p className="text-xs text-muted-foreground self-center">
                or wait {retrySeconds}s
              </p>
            )}
          </div>
        </div>
      );
    }
    
    switch (widget.displayMode) {
      case 'table':
        return renderTableView();
      case 'chart':
        return renderChartView();
      default:
        return renderCardView();
    }
  };
  
  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "glass-card p-3 sm:p-4 transition-all duration-200 animate-fade-in",
        isDragging && "widget-dragging opacity-90"
      )}
    >
      <div className="flex items-center justify-between mb-3 sm:mb-4 gap-2">
        <div className="flex items-center gap-1.5 sm:gap-2 min-w-0 flex-1">
          <button
            {...attributes}
            {...listeners}
            className="cursor-grab active:cursor-grabbing p-0.5 sm:p-1 rounded hover:bg-secondary/50 text-muted-foreground shrink-0 touch-none"
          >
            <GripVertical className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>
          <div className="min-w-0 flex-1">
            <h3 className="font-semibold text-xs sm:text-sm flex items-center gap-1.5 sm:gap-2 truncate">
              <span className="truncate">{widget.name}</span>
              {widget.connectionType === 'websocket' && widget.websocketStatus && (
                <span className={cn(
                  "text-[10px] sm:text-xs px-1 sm:px-1.5 py-0.5 rounded font-normal flex items-center gap-0.5 sm:gap-1 shrink-0",
                  widget.websocketStatus === 'connected' && "bg-emerald-500/10 text-emerald-500",
                  widget.websocketStatus === 'connecting' && "bg-blue-500/10 text-blue-500",
                  widget.websocketStatus === 'disconnected' && "bg-orange-500/10 text-orange-500",
                  widget.websocketStatus === 'error' && "bg-destructive/10 text-destructive"
                )}>
                  <span className={cn(
                    "w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full animate-pulse",
                    widget.websocketStatus === 'connected' && "bg-emerald-500",
                    widget.websocketStatus === 'connecting' && "bg-blue-500",
                    widget.websocketStatus === 'disconnected' && "bg-orange-500",
                    widget.websocketStatus === 'error' && "bg-destructive"
                  )} />
                  <span className="hidden xs:inline">
                    {widget.websocketStatus === 'connected' && 'Live'}
                    {widget.websocketStatus === 'connecting' && 'Connecting...'}
                    {widget.websocketStatus === 'disconnected' && 'Disconnected'}
                    {widget.websocketStatus === 'error' && 'Error'}
                  </span>
                </span>
              )}
            </h3>
            {widget.lastUpdated && (
              <p className="text-[10px] sm:text-xs text-muted-foreground truncate">
                {new Date(widget.lastUpdated).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-0.5 sm:gap-1 shrink-0">
          {widget.isLoading && (
            <Loader2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 animate-spin text-muted-foreground" />
          )}
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 sm:h-8 sm:w-8"
            onClick={() => fetchData(true)}
          >
            <RefreshCw className="w-3 h-3 sm:w-4 sm:h-4" />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-7 w-7 sm:h-8 sm:w-8">
                <Settings className="w-3 h-3 sm:w-4 sm:h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="glass-card">
              <DropdownMenuItem onClick={() => onEdit(widget)}>
                <Pencil className="w-4 h-4 mr-2" />
                Edit Widget
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => removeWidget(widget.id)}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Remove Widget
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      
      {renderContent()}
    </div>
  );
}
