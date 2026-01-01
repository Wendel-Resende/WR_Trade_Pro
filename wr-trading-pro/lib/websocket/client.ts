'use client';

import { io, Socket } from 'socket.io-client';
import {
  TickData,
  CandleData,
  OrderBookData,
  AccountInfo,
  MarketSummary,
  WebSocketEventMap,
  EventCallback,
  TickCallback,
  WebSocketConfig,
  WebSocketResponse
} from './types';

// Mapeamento de tipos para eventos
type EventName = keyof WebSocketEventMap;
type EventData<T extends EventName> = WebSocketEventMap[T];

const WS_URL = process.env.NEXT_PUBLIC_MT5_WS_URL || 'http://localhost:8765';

class WebSocketClient {
  private static instance: WebSocketClient;
  private socket: Socket | null = null;
  private subscribers: Map<string, Set<TickCallback>> = new Map();
  private isConnecting = false;
  private isConnected = false;
  private pendingSubscriptions: Set<string> = new Set();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 10;
  private reconnectDelay = 5000;
  private reconnectDelayMultiplier = 1.5;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private pingInterval: NodeJS.Timeout | null = null;
  private eventListeners = new Map<EventName, Set<EventCallback>>();
  private connectionPromise: Promise<boolean> | null = null;
  private connectionResolve: ((value: boolean) => void) | null = null;
  private lastConnectionError: string | null = null;
  private connectionStartTime: number | null = null;
  private config: WebSocketConfig;

  private constructor() {
    const WS_URL = process.env.NEXT_PUBLIC_MT5_WS_URL || 'http://localhost:8765';
    
    this.config = {
      url: WS_URL,
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: this.maxReconnectAttempts,
      reconnectionDelay: this.reconnectDelay,
      timeout: 15000,
    };
  }

  static getInstance(): WebSocketClient {
    if (!WebSocketClient.instance) {
      WebSocketClient.instance = new WebSocketClient();
    }
    return WebSocketClient.instance;
  }

  // Event emitter methods com tipos seguros
  on<T extends EventName>(event: T, callback: (data: EventData<T>) => void): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set());
    }
    this.eventListeners.get(event)!.add(callback as EventCallback);
    
    // Registrar também no socket se estiver conectado
    if (this.socket && this.isConnected) {
      this.socket.on(event as string, callback as any);
    }
  }

  off<T extends EventName>(event: T, callback?: (data: EventData<T>) => void): void {
    if (this.eventListeners.has(event)) {
      if (callback) {
        this.eventListeners.get(event)!.delete(callback as EventCallback);
      } else {
        this.eventListeners.get(event)!.clear();
      }
    }
    
    if (this.socket && callback) {
      try {
        this.socket.off(event as string, callback as any);
      } catch (error) {
        console.debug(`[WebSocketClient] Error removing listener from socket:`, error);
      }
    }
  }

  once<T extends EventName>(event: T, callback: (data: EventData<T>) => void): void {
    if (!this.socket) {
      console.warn(`[WebSocketClient] Cannot listen to event '${event}' - socket not initialized`);
      return;
    }

    const onceHandler = (data: any) => {
      this.off(event, onceHandler as any);
      callback(data);
    };
    
    this.on(event, onceHandler as any);
    this.socket.once(event as string, onceHandler);
  }

  private emit<T extends EventName>(event: T, data: EventData<T>): void {
    if (this.eventListeners.has(event)) {
      this.eventListeners.get(event)!.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in event listener for ${event}:`, error);
        }
      });
    }
  }

  private getErrorCode(error: Error): string {
    if (error.message.includes('ECONNREFUSED')) return 'ECONNREFUSED';
    if (error.message.includes('timeout')) return 'TIMEOUT';
    if (error.message.includes('Network Error')) return 'NETWORK_ERROR';
    if (error.message.includes('xhr poll error')) return 'POLL_ERROR';
    return 'UNKNOWN';
  }

  private scheduleReconnection(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.log(`❌ Máximo de tentativas de reconexão atingido (${this.maxReconnectAttempts})`);
      this.emit('error', {
        code: 'MAX_RECONNECT_ATTEMPTS',
        details: `Failed to reconnect after ${this.maxReconnectAttempts} attempts`,
        timestamp: new Date().toISOString()
      });
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(this.reconnectDelayMultiplier, this.reconnectAttempts - 1);
    
    console.log(`🔄 Tentativa ${this.reconnectAttempts}/${this.maxReconnectAttempts} em ${Math.round(delay/1000)}s`);
    
    this.reconnectTimer = setTimeout(() => {
      console.log('🔄 Tentando reconectar...');
      this.connect().catch(error => {
        console.error('❌ Falha na reconexão:', error);
      });
    }, delay);
  }

  async connect(): Promise<boolean> {
    if (this.isConnected) {
      console.log('✅ Already connected to WebSocket');
      return true;
    }

    if (this.isConnecting && this.connectionPromise) {
      console.log('⏳ Already connecting, waiting for connection...');
      return this.connectionPromise;
    }

    this.isConnecting = true;
    this.connectionStartTime = Date.now();
    this.lastConnectionError = null;
    
    console.log('🔌 Connecting to MT5 Socket.IO:', this.config.url);
    console.log('🔌 Environment NEXT_PUBLIC_MT5_WS_URL:', process.env.NEXT_PUBLIC_MT5_WS_URL);
    
    this.connectionPromise = new Promise<boolean>((resolve) => {
      this.connectionResolve = resolve;
    });

    try {
      this.socket = io(this.config.url, {
        transports: this.config.transports,
        reconnection: this.config.reconnection,
        reconnectionAttempts: this.config.reconnectionAttempts,
        reconnectionDelay: this.config.reconnectionDelay,
        timeout: this.config.timeout,
        autoConnect: true,
      });
      
      this.setupSocketListeners();
      
      return this.connectionPromise;
    } catch (error) {
      console.error('❌ Failed to create Socket.IO connection:', error);
      this.isConnecting = false;
      this.connectionResolve?.(false);
      return false;
    }
  }

  private setupSocketListeners(): void {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      const connectionTime = Date.now() - (this.connectionStartTime || Date.now());
      console.log(`✅ Connected to MT5 Socket.IO in ${connectionTime}ms`);
      
      this.isConnected = true;
      this.isConnecting = false;
      this.reconnectAttempts = 0;
      this.lastConnectionError = null;
      
      this.startPingInterval();
      
      this.pendingSubscriptions.forEach(symbol => {
        this.sendSubscribe(symbol);
      });
      this.pendingSubscriptions.clear();
      
      this.emit('connected', { 
        timestamp: new Date().toISOString(), 
        message: 'Connected to MT5 Socket.IO Server',
        connectionTime
      });
      
      if (this.connectionResolve) {
        this.connectionResolve(true);
        this.connectionResolve = null;
      }
    });

    this.socket.on('disconnect', (reason: string) => {
      console.log('🔌 Disconnected from MT5:', reason);
      this.isConnected = false;
      this.clearTimers();
      
      this.subscribers.forEach((_, symbol) => {
        this.pendingSubscriptions.add(symbol);
      });
      
      this.emit('disconnected', { 
        reason, 
        timestamp: new Date().toISOString() 
      });
      
      if (reason !== 'io client disconnect' && reason !== 'transport close') {
        this.scheduleReconnection();
      }
    });

    this.socket.on('connect_error', (error: Error) => {
      this.isConnecting = false;
      this.isConnected = false;
      this.lastConnectionError = error.message;
      
      const errorData = {
        code: this.getErrorCode(error),
        details: error.message,
        timestamp: new Date().toISOString(),
        reconnectAttempt: this.reconnectAttempts + 1
      };
      
      if (error.message.includes('ECONNREFUSED')) {
        console.debug('🔌 Backend não está disponível:', error.message);
      } else if (error.message.includes('timeout')) {
        console.warn('⏱️ Timeout na conexão:', error.message);
      } else {
        console.error('❌ Erro de conexão:', error.message);
      }
      
      this.emit('error', errorData);
      
      this.scheduleReconnection();
      
      if (this.connectionResolve) {
        this.connectionResolve(false);
        this.connectionResolve = null;
      }
    });

    this.socket.on('tick', (data: { symbol: string; tick: TickData; timestamp: string }) => {
      const callbacks = this.subscribers.get(data.symbol);
      if (callbacks) {
        callbacks.forEach(cb => {
          try {
            cb(data.tick);
          } catch (error) {
            console.error('Error in tick callback:', error);
          }
        });
      }
    });

    this.socket.on('connected', (data: WebSocketEventMap['connected']) => {
      this.emit('connected', data);
    });

    this.socket.on('disconnected', (data: WebSocketEventMap['disconnected']) => {
      this.emit('disconnected', data);
    });

    this.socket.on('error', (data: WebSocketEventMap['error']) => {
      this.emit('error', data);
    });

    this.socket.on('subscribed', (data: WebSocketEventMap['subscribed']) => {
      console.log('✅ Subscribed to:', data.symbol);
      this.emit('subscribed', data);
    });

    this.socket.on('unsubscribed', (data: WebSocketEventMap['unsubscribed']) => {
      console.log('🚫 Unsubscribed from:', data.symbol);
      this.emit('unsubscribed', data);
    });

    this.socket.on('market_summary', (data: WebSocketEventMap['market_summary']) => {
      this.emit('market_summary', data);
    });

    this.socket.on('account_info', (data: WebSocketEventMap['account_info']) => {
      this.emit('account_info', data);
    });

    this.socket.on('health', (data: WebSocketEventMap['health']) => {
      this.emit('health', data);
    });

    this.socket.on('candles', (data: WebSocketEventMap['candles']) => {
      this.emit('candles', data);
    });

    this.socket.on('order_book', (data: WebSocketEventMap['order_book']) => {
      this.emit('order_book', data);
    });

    this.socket.on('symbols', (data: WebSocketEventMap['symbols']) => {
      this.emit('symbols', data);
    });

    if (process.env.NODE_ENV === 'development') {
      // Log apenas eventos importantes
      this.socket.onAny((eventName: string, ...args: any[]) => {
        // Log apenas eventos importantes para debug
        const importantEvents = ['connected', 'disconnected', 'error', 'subscribed', 'unsubscribed'];
        if (importantEvents.includes(eventName)) {
          console.log(`[SOCKET.IO] Event: ${eventName}`, args);
        }
      });
    }
  }

  private sendSubscribe(symbol: string) {
    if (!this.socket || !this.isConnected) {
      console.log('⏳ Queuing subscription:', symbol);
      this.pendingSubscriptions.add(symbol);
      return;
    }

    console.log('📊 Subscribing to:', symbol);
    this.socket.emit('subscribe', { symbol, timeframe: 'M5' });
  }

  private sendUnsubscribe(symbol: string) {
    if (!this.socket || !this.isConnected) {
      console.log('⏳ Queuing unsubscription:', symbol);
      return;
    }

    console.log('🚫 Unsubscribing from:', symbol);
    this.socket.emit('unsubscribe', { symbol });
  }

  subscribe(symbol: string, callback: TickCallback) {
    if (!this.subscribers.has(symbol)) {
      this.subscribers.set(symbol, new Set());
      this.sendSubscribe(symbol);
    }
    
    this.subscribers.get(symbol)!.add(callback);
    
    console.log(`📊 Subscriber added for ${symbol}. Total: ${this.subscribers.get(symbol)!.size}`);
  }

  unsubscribe(symbol: string, callback?: TickCallback) {
    const callbacks = this.subscribers.get(symbol);
    if (!callbacks) return;
    
    if (callback) {
      callbacks.delete(callback);
      console.log(`📊 Subscriber removed for ${symbol}. Remaining: ${callbacks.size}`);
      
      if (callbacks.size === 0) {
        this.subscribers.delete(symbol);
        this.sendUnsubscribe(symbol);
      }
    } else {
      this.subscribers.delete(symbol);
      this.sendUnsubscribe(symbol);
      console.log(`📊 All subscribers removed for ${symbol}`);
    }
  }

  getSymbols(): Promise<string[]> {
    return new Promise((resolve, reject) => {
      if (!this.socket || !this.isConnected) {
        reject(new Error('Not connected to Socket.IO server'));
        return;
      }

      const timeout = setTimeout(() => {
        reject(new Error('Timeout waiting for symbols'));
      }, 5000);

      const handler = (data: { symbols: string[]; count: number; timestamp: string }) => {
        clearTimeout(timeout);
        this.off('symbols', handler);
        resolve(data.symbols);
      };

      this.once('symbols', handler);
      this.socket.emit('get_symbols', {});
    });
  }

  getCandles(symbol: string, timeframe: string = 'M5', count: number = 100): Promise<CandleData[]> {
    return new Promise((resolve, reject) => {
      if (!this.socket || !this.isConnected) {
        console.error('[CANDLES] Socket not connected');
        resolve([]);
        return;
      }

      console.log(`[CANDLES] Emitting get_candles for ${symbol} (${timeframe}) count=${count}`);
      
      const timeout = setTimeout(() => {
        console.error(`[CANDLES] ⏱️ TIMEOUT waiting for candles for ${symbol}`);
        this.socket?.off('candles', handler);
        resolve([]);
      }, 10000);

      const handler = (data: WebSocketEventMap['candles']) => {
        console.log(`[CANDLES] ✅ Received candles event:`, data.symbol, data.timeframe, `count=${data.candles?.length || 0}`);
        
        if (data.symbol === symbol && data.timeframe === timeframe) {
          console.log(`[CANDLES] ✅ Match for ${symbol}/${timeframe}, resolving`);
          clearTimeout(timeout);
          this.socket?.off('candles', handler);
          resolve(data.candles || []);
        }
      };

      this.socket.on('candles', handler);
      this.socket.emit('get_candles', { symbol, timeframe, count });
    });
  }

  getOrderBook(symbol: string, depth: number = 10): Promise<OrderBookData> {
    return new Promise((resolve, reject) => {
      if (!this.socket || !this.isConnected) {
        reject(new Error('Not connected to Socket.IO server'));
        return;
      }

      const timeout = setTimeout(() => {
        reject(new Error('Timeout waiting for order book'));
      }, 5000);

      const handler = (data: { symbol: string; order_book: OrderBookData; timestamp: string }) => {
        if (data.symbol === symbol) {
          clearTimeout(timeout);
          this.off('order_book', handler);
          resolve(data.order_book);
        }
      };

      this.once('order_book', handler);
      this.socket.emit('get_order_book', { symbol, depth });
    });
  }

  getAccountInfo(): Promise<AccountInfo> {
    return new Promise((resolve, reject) => {
      if (!this.socket || !this.isConnected) {
        reject(new Error('Not connected to Socket.IO server'));
        return;
      }

      const timeout = setTimeout(() => {
        reject(new Error('Timeout waiting for account info'));
      }, 5000);

      const handler = (data: { account: AccountInfo; timestamp: string }) => {
        clearTimeout(timeout);
        this.off('account_info', handler);
        resolve(data.account);
      };

      this.once('account_info', handler);
      this.socket.emit('get_account_info', {});
    });
  }

  ping(): void {
    if (this.isConnected && this.socket) {
      this.socket.emit('ping', {});
    }
  }

  getIsConnected(): boolean {
    return this.isConnected;
  }

  getSubscribedSymbols(): string[] {
    return Array.from(this.subscribers.keys());
  }

  disconnect() {
    this.clearTimers();
    
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    
    this.isConnected = false;
    this.subscribers.clear();
    this.pendingSubscriptions.clear();
    this.reconnectAttempts = 0;
  }

  private startPingInterval() {
    this.clearTimers();
    this.pingInterval = setInterval(() => {
      this.ping();
    }, 30000);
  }

  private clearTimers() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }
}

// Exportar singleton
export const wsClient = WebSocketClient.getInstance();

// NÃO conectar automaticamente - deixar o componente
