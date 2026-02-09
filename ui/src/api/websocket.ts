/**
 * WebSocket Client for Real-time Data
 */
import { API_BASE_URL } from './client';

type MessageHandler = (data: any) => void;
type ConnectionHandler = () => void;
type ErrorHandler = (error: Event) => void;

interface WebSocketClientOptions {
  reconnect?: boolean;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
}

const WS_BASE_URL = API_BASE_URL.replace('http', 'ws');

export class WebSocketClient {
  private url: string;
  private ws: WebSocket | null = null;
  private reconnect: boolean;
  private reconnectInterval: number;
  private maxReconnectAttempts: number;
  private reconnectAttempts: number = 0;
  private messageHandlers: Map<string, MessageHandler[]> = new Map();
  private onConnectHandlers: ConnectionHandler[] = [];
  private onDisconnectHandlers: ConnectionHandler[] = [];
  private onErrorHandlers: ErrorHandler[] = [];
  private pingInterval: number | null = null;

  constructor(endpoint: string, options: WebSocketClientOptions = {}) {
    this.url = `${WS_BASE_URL}${endpoint}`;
    this.reconnect = options.reconnect ?? true;
    this.reconnectInterval = options.reconnectInterval ?? 5000;
    this.maxReconnectAttempts = options.maxReconnectAttempts ?? 10;
  }

  connect(): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      return;
    }

    this.ws = new WebSocket(this.url);

    this.ws.onopen = () => {
      console.log(`WebSocket connected: ${this.url}`);
      this.reconnectAttempts = 0;
      this.startPing();
      this.onConnectHandlers.forEach((handler) => handler());
    };

    this.ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        const messageType = data.type || 'default';

        // Call handlers for this message type
        const handlers = this.messageHandlers.get(messageType) || [];
        handlers.forEach((handler) => handler(data));

        // Call handlers for 'all' messages
        const allHandlers = this.messageHandlers.get('*') || [];
        allHandlers.forEach((handler) => handler(data));
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };

    this.ws.onclose = () => {
      console.log('WebSocket disconnected');
      this.stopPing();
      this.onDisconnectHandlers.forEach((handler) => handler());

      if (this.reconnect && this.reconnectAttempts < this.maxReconnectAttempts) {
        this.reconnectAttempts++;
        console.log(
          `Reconnecting... (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`
        );
        setTimeout(() => this.connect(), this.reconnectInterval);
      }
    };

    this.ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      this.onErrorHandlers.forEach((handler) => handler(error));
    };
  }

  disconnect(): void {
    this.reconnect = false;
    this.stopPing();
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  send(data: any): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    } else {
      console.warn('WebSocket is not connected');
    }
  }

  on(messageType: string, handler: MessageHandler): void {
    if (!this.messageHandlers.has(messageType)) {
      this.messageHandlers.set(messageType, []);
    }
    this.messageHandlers.get(messageType)!.push(handler);
  }

  off(messageType: string, handler?: MessageHandler): void {
    if (!handler) {
      this.messageHandlers.delete(messageType);
    } else {
      const handlers = this.messageHandlers.get(messageType);
      if (handlers) {
        const index = handlers.indexOf(handler);
        if (index > -1) {
          handlers.splice(index, 1);
        }
      }
    }
  }

  onConnect(handler: ConnectionHandler): void {
    this.onConnectHandlers.push(handler);
  }

  onDisconnect(handler: ConnectionHandler): void {
    this.onDisconnectHandlers.push(handler);
  }

  onError(handler: ErrorHandler): void {
    this.onErrorHandlers.push(handler);
  }

  private startPing(): void {
    this.pingInterval = window.setInterval(() => {
      this.send({ type: 'ping' });
    }, 30000);
  }

  private stopPing(): void {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }

  get isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }
}

// Pre-configured WebSocket clients for different channels
export const productionWS = new WebSocketClient('/ws/production');
export const equipmentWS = new WebSocketClient('/ws/equipment');
export const alertsWS = new WebSocketClient('/ws/alerts');
export const dashboardWS = new WebSocketClient('/ws/dashboard');

export default WebSocketClient;
