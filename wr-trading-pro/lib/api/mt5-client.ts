/**
 * MT5 WebSocket Client
 * Connects to MT5 WebSocket server for real-time market data
 */

const WS_URL = process.env.NEXT_PUBLIC_MT5_WS_URL || 'ws://localhost:8765';

export interface TickData {
  symbol: string;
  bid: number;
  ask: number;
  last: number;
  volume: number;
  time: string;
  spread: number;
  change: number;
  changePercent: number;
}

export interface CandleData {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface OrderBookData {
  bids: Array<{ price: number; volume: number }>;
  asks: Array<{ price: number; volume: number }>;
  spread: number;
  totalVolume: number;
}

export interface AccountInfo {
  login: number;
  balance: number;
  equity: number;
  margin: number;
  freeMargin: number;
  profit: number;
  leverage: number;
}

export class MT5Client {
  private socket: any = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 10;
  private reconnectDelay = 5000;
  private isConnecting = false;
  private eventListeners: Map<string, Function[]> = new Map();

  constructor() {
    if (typeof window !== 'undefined') {
      this.initializeSocketIO();
    }
  }

  private initializeSocketIO() {
    // Dynamically import socket.io-client only on client side
    import('socket.io-client').then(({ io }) => {
      this.socket = io(WS_URL, {
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: this.maxReconnectAttempts,
        reconnectionDelay: this.reconnectDelay,
      });

      this.setupEventListeners();
    }).catch(error => {
      console.error('❌ Failed to load socket.io-client:', error);
    });
  }

  private setupEventListeners() {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('✅ Conectado ao MT5 WebSocket');
      this.reconnectAttempts = 0;
      this.emit('connected', { connected: true });
    });

    this.socket.on('disconnect', () => {
      console.log('🔌 Desconectado do MT5 WebSocket');
      this.emit('disconnected', { connected: false });
    });

    this.socket.on('error', (error: any) => {
      console.error('❌ Erro MT5:', error);
      this.emit('error', error);
    });

    this.socket.on('tick', (data: any) => {
      this.emit('tick', data);
    });

    this.socket.on('candles', (data: any) => {
      this.emit('candles', data);
    });

    this.socket.on('order_book', (data: any) => {
      this.emit('order_book', data);
    });

    this.socket.on('account_info', (data: any) => {
      this.emit('account_info', data);
    });

    this.socket.on('market_summary', (data: any) => {
      this.emit('market_summary', data);
    });

    this.socket.on('health', (data: any) => {
      this.emit('health', data);
    });

    this.socket.on('subscribed', (data: any) => {
      this.emit('subscribed', data);
    });

    this.socket.on('unsubscribed', (data: any) => {
      this.emit('unsubscribed', data);
    });
  }

  connect() {
    if (this.socket && !this.socket.connected) {
      this.socket.connect();
    }
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
    }
  }

  subscribe(symbol: string, timeframe: string = 'M5') {
    if (!this.socket || !this.socket.connected) {
      console.warn('⚠️ Socket não conectado, tentando conectar...');
      this.connect();
      setTimeout(() => this.subscribe(symbol, timeframe), 1000);
      return;
    }

    this.socket.emit('subscribe', { symbol, timeframe });
  }

  unsubscribe(symbol: string) {
    if (!this.socket || !this.socket.connected) {
      return;
    }

    this.socket.emit('unsubscribe', { symbol });
  }

  getCandles(symbol: string, timeframe: string = 'M5', count: number = 100) {
    if (!this.socket || !this.socket.connected) {
      return;
    }

    this.socket.emit('get_candles', { symbol, timeframe, count });
  }

  getOrderBook(symbol: string, depth: number = 10) {
    if (!this.socket || !this.socket.connected) {
      return;
    }

    this.socket.emit('get_order_book', { symbol, depth });
  }

  getAccountInfo() {
    if (!this.socket || !this.socket.connected) {
      return;
    }

    this.socket.emit('get_account_info');
  }

  getSymbols() {
    if (!this.socket || !this.socket.connected) {
      return;
    }

    this.socket.emit('get_symbols');
  }

  ping() {
    if (!this.socket || !this.socket.connected) {
      return;
    }

    this.socket.emit('ping');
  }

  on(event: string, callback: Function) {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event)!.push(callback);
  }

  off(event: string, callback: Function) {
    if (!this.eventListeners.has(event)) return;
    
    const listeners = this.eventListeners.get(event)!;
    const index = listeners.indexOf(callback);
    if (index > -1) {
      listeners.splice(index, 1);
    }
  }

  private emit(event: string, data: any) {
    if (!this.eventListeners.has(event)) return;
    
    this.eventListeners.get(event)!.forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error(`Error in ${event} callback:`, error);
      }
    });
  }

  isConnected(): boolean {
    return this.socket?.connected || false;
  }
}

// Singleton instance
export const mt5Client = new MT5Client();
