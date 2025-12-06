export type WebSocketStatus = 'connecting' | 'connected' | 'disconnected' | 'error';

export interface WebSocketConfig {
  url: string;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
  onMessage?: (data: unknown) => void;
  onStatusChange?: (status: WebSocketStatus) => void;
  onError?: (error: Event | Error) => void;
}

export class WebSocketManager {
  private ws: WebSocket | null = null;
  private config: WebSocketConfig;
  private reconnectAttempts: number = 0;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private status: WebSocketStatus = 'disconnected';
  private shouldReconnect: boolean = true;

  constructor(config: WebSocketConfig) {
    this.config = {
      reconnectInterval: 5000,
      maxReconnectAttempts: 5,
      ...config,
    };
  }

  connect(): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      return;
    }

    this.updateStatus('connecting');

    try {
      this.ws = new WebSocket(this.config.url);

      this.ws.onopen = () => {
        this.reconnectAttempts = 0;
        this.updateStatus('connected');
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.config.onMessage?.(data);
        } catch (error) {
          this.config.onMessage?.(event.data);
        }
      };

      this.ws.onerror = (event) => {
        this.updateStatus('error');
        this.config.onError?.(event);
      };

      this.ws.onclose = () => {
        this.updateStatus('disconnected');
        
        if (this.shouldReconnect) {
          this.scheduleReconnect();
        }
      };
    } catch (error) {
      this.updateStatus('error');
      this.config.onError?.(error as Error);
      
      if (this.shouldReconnect) {
        this.scheduleReconnect();
      }
    }
  }

  private scheduleReconnect(): void {
    if (
      this.config.maxReconnectAttempts &&
      this.reconnectAttempts >= this.config.maxReconnectAttempts
    ) {
      this.shouldReconnect = false;
      return;
    }

    this.reconnectAttempts++;
    const delay = this.config.reconnectInterval! * Math.min(this.reconnectAttempts, 3);

    this.reconnectTimer = setTimeout(() => {
      this.connect();
    }, delay);
  }

  send(data: unknown): boolean {
    if (this.ws?.readyState === WebSocket.OPEN) {
      try {
        this.ws.send(typeof data === 'string' ? data : JSON.stringify(data));
        return true;
      } catch (error) {
        return false;
      }
    }
    return false;
  }

  disconnect(): void {
    this.shouldReconnect = false;
    
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }

    this.updateStatus('disconnected');
  }

  getStatus(): WebSocketStatus {
    return this.status;
  }

  private updateStatus(status: WebSocketStatus): void {
    this.status = status;
    this.config.onStatusChange?.(status);
  }

  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }
}

// WebSocket connection pool for managing multiple connections
export class WebSocketPool {
  private connections: Map<string, WebSocketManager> = new Map();

  connect(id: string, config: WebSocketConfig): WebSocketManager {
    // Disconnect existing connection if any
    this.disconnect(id);

    const manager = new WebSocketManager(config);
    this.connections.set(id, manager);
    manager.connect();

    return manager;
  }

  disconnect(id: string): void {
    const manager = this.connections.get(id);
    if (manager) {
      manager.disconnect();
      this.connections.delete(id);
    }
  }

  get(id: string): WebSocketManager | undefined {
    return this.connections.get(id);
  }

  disconnectAll(): void {
    for (const [id, manager] of this.connections) {
      manager.disconnect();
    }
    this.connections.clear();
  }

  getAll(): Map<string, WebSocketManager> {
    return this.connections;
  }
}

// Singleton pool instance
export const wsPool = new WebSocketPool();

// Helper to check if URL is a WebSocket URL
export function isWebSocketURL(url: string): boolean {
  try {
    const urlObj = new URL(url);
    return urlObj.protocol === 'ws:' || urlObj.protocol === 'wss:';
  } catch {
    return false;
  }
}

// Helper to convert HTTP URL to WebSocket URL (if applicable)
export function toWebSocketURL(url: string): string | null {
  try {
    const urlObj = new URL(url);
    if (urlObj.protocol === 'http:') {
      urlObj.protocol = 'ws:';
      return urlObj.toString();
    }
    if (urlObj.protocol === 'https:') {
      urlObj.protocol = 'wss:';
      return urlObj.toString();
    }
    return null;
  } catch {
    return null;
  }
}
