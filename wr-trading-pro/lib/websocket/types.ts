/**
 * Tipos TypeScript para dados WebSocket do MT5
 */

// Tipos básicos de dados de mercado
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

// Alias para compatibilidade com código existente
export type MarketData = TickData;

export interface CandleData {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  spread?: number;
}

export interface OrderBookEntry {
  price: number;
  volume: number;
}

export interface OrderBookData {
  symbol: string;
  time: string;
  bids: OrderBookEntry[];
  asks: OrderBookEntry[];
  spread: number;
  midPrice: number;
}

export interface AccountInfo {
  login: number;
  balance: number;
  equity: number;
  margin: number;
  freeMargin: number;
  marginLevel: number;
  currency: string;
  leverage: number;
  name: string;
  server: string;
  profit: number;
}

export interface MarketSummary {
  time: string;
  totalSymbols: number;
  totalVolume: number;
  advancing: number;
  declining: number;
  unchanged: number;
  advanceDeclineRatio: number;
  avgRsi: number;
  topGainers: Array<{
    symbol: string;
    changePercent: number;
    lastPrice: number;
  }>;
  topLosers: Array<{
    symbol: string;
    changePercent: number;
    lastPrice: number;
  }>;
  marketSentiment: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
}

export interface PositionData {
  id: string;
  symbol: string;
  type: 'LONG' | 'SHORT';
  quantity: number;
  entryPrice: number;
  currentPrice: number;
  pnl: number;
  pnlPercent: number;
  status: 'OPEN' | 'CLOSED';
  openedAt: string;
  closedAt?: string;
}

export interface TradeData {
  id: string;
  symbol: string;
  type: 'BUY' | 'SELL';
  quantity: number;
  price: number;
  executedAt: string;
  commission?: number;
  swap?: number;
  profit?: number;
}

// Eventos WebSocket
export interface WebSocketEventMap {
  // Eventos de conexão
  'connected': { timestamp: string; message: string; connectionTime?: number };
  'disconnected': { reason?: string; timestamp: string };
  'error': { code: string; details: string; timestamp: string; reconnectAttempt?: number };
  
  // Eventos de dados
  'tick': { symbol: string; tick: TickData; timestamp: string };
  'candles': { symbol: string; timeframe: string; candles: CandleData[]; count: number; timestamp: string };
  'order_book': { symbol: string; order_book: OrderBookData; timestamp: string };
  'account_info': { account: AccountInfo; timestamp: string };
  'market_summary': MarketSummary;
  'health': { status: 'HEALTHY' | 'DEGRADED' | 'UNHEALTHY'; timestamp: string; details?: string };
  
  // Eventos de controle
  'subscribed': { symbol: string; timestamp: string };
  'unsubscribed': { symbol: string; timestamp: string };
  'symbols': { symbols: string[]; count: number; timestamp: string };
}

// Tipos de callback
export type EventCallback<T = any> = (data: T) => void;
export type TickCallback = (data: TickData) => void;

// Tipos para configuração
export interface WebSocketConfig {
  url: string;
  transports?: string[];
  reconnection?: boolean;
  reconnectionAttempts?: number;
  reconnectionDelay?: number;
  timeout?: number;
}

// Tipos para resposta de operações
export interface WebSocketResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: string;
}
