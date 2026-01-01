/**
 * Market Data Context for managing real-time market data across the application
 */

import React, { createContext, useContext, useReducer, useEffect, useCallback, ReactNode } from 'react';
import { wsClient } from '@/lib/websocket/client';
import { MarketData, OrderBookData } from '@/lib/websocket/types';

// Types
export interface MarketDataState {
  symbols: string[];
  marketData: Record<string, MarketData | null>;
  orderBooks: Record<string, OrderBookData | null>;
  subscriptions: Set<string>;
  isConnected: boolean;
  isLoading: boolean;
  error: string | null;
}

export type MarketDataAction =
  | { type: 'SET_CONNECTED'; payload: boolean }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'ADD_SYMBOL'; payload: string }
  | { type: 'REMOVE_SYMBOL'; payload: string }
  | { type: 'UPDATE_MARKET_DATA'; payload: { symbol: string; data: MarketData } }
  | { type: 'UPDATE_ORDER_BOOK'; payload: { symbol: string; data: OrderBookData } }
  | { type: 'SET_SYMBOLS'; payload: string[] }
  | { type: 'CLEAR_DATA' };

// Initial state
const initialState: MarketDataState = {
  symbols: ['EURUSD', 'GBPUSD', 'USDJPY', 'BTCUSD', 'ETHUSD', 'XAUUSD'],
  marketData: {},
  orderBooks: {},
  subscriptions: new Set(),
  isConnected: false,
  isLoading: true,
  error: null,
};

// Reducer
function marketDataReducer(state: MarketDataState, action: MarketDataAction): MarketDataState {
  switch (action.type) {
    case 'SET_CONNECTED':
      return { ...state, isConnected: action.payload };
    
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    
    case 'ADD_SYMBOL': {
      const newSubscriptions = new Set(state.subscriptions);
      newSubscriptions.add(action.payload);
      
      const newSymbols = [...state.symbols];
      if (!newSymbols.includes(action.payload)) {
        newSymbols.push(action.payload);
      }
      
      return {
        ...state,
        symbols: newSymbols,
        subscriptions: newSubscriptions,
      };
    }
    
    case 'REMOVE_SYMBOL': {
      const newSubscriptions = new Set(state.subscriptions);
      newSubscriptions.delete(action.payload);
      
      const newMarketData = { ...state.marketData };
      delete newMarketData[action.payload];
      
      const newOrderBooks = { ...state.orderBooks };
      delete newOrderBooks[action.payload];
      
      return {
        ...state,
        subscriptions: newSubscriptions,
        marketData: newMarketData,
        orderBooks: newOrderBooks,
      };
    }
    
    case 'UPDATE_MARKET_DATA':
      return {
        ...state,
        marketData: {
          ...state.marketData,
          [action.payload.symbol]: action.payload.data,
        },
        isLoading: false,
        error: null,
      };
    
    case 'UPDATE_ORDER_BOOK':
      return {
        ...state,
        orderBooks: {
          ...state.orderBooks,
          [action.payload.symbol]: action.payload.data,
        },
      };
    
    case 'SET_SYMBOLS':
      return { ...state, symbols: action.payload };
    
    case 'CLEAR_DATA':
      return {
        ...initialState,
        symbols: state.symbols,
        subscriptions: new Set(),
      };
    
    default:
      return state;
  }
}

// Context
interface MarketDataContextType {
  state: MarketDataState;
  dispatch: React.Dispatch<MarketDataAction>;
  subscribe: (symbol: string) => void;
  unsubscribe: (symbol: string) => void;
  getMarketData: (symbol: string) => MarketData | null;
  getOrderBook: (symbol: string) => OrderBookData | null;
  connect: () => Promise<void>;
  disconnect: () => void;
  isSubscribed: (symbol: string) => boolean;
  refreshAll: () => Promise<void>;
}

const MarketDataContext = createContext<MarketDataContextType | undefined>(undefined);

// Provider props
interface MarketDataProviderProps {
  children: ReactNode;
  autoConnect?: boolean;
  initialSymbols?: string[];
}

// Provider component
export function MarketDataProvider({ 
  children, 
  autoConnect = true,
  initialSymbols 
}: MarketDataProviderProps) {
  const [state, dispatch] = useReducer(marketDataReducer, {
    ...initialState,
    symbols: initialSymbols || initialState.symbols,
  });

  // Subscribe to a symbol
  const subscribe = useCallback((symbol: string) => {
    if (!state.subscriptions.has(symbol)) {
      dispatch({ type: 'ADD_SYMBOL', payload: symbol });
      
      if (state.isConnected) {
        // Subscribe to market data
        wsClient.subscribe(symbol, (data: MarketData) => {
          dispatch({ type: 'UPDATE_MARKET_DATA', payload: { symbol, data } });
        });
        
        // Fetch order book
        wsClient.getOrderBook(symbol).then((orderBook) => {
          dispatch({ type: 'UPDATE_ORDER_BOOK', payload: { symbol, data: orderBook } });
        }).catch((error) => {
          console.error(`Failed to fetch order book for ${symbol}:`, error);
        });
      }
    }
  }, [state.isConnected, state.subscriptions]);

  // Unsubscribe from a symbol
  const unsubscribe = useCallback((symbol: string) => {
    if (state.subscriptions.has(symbol)) {
      dispatch({ type: 'REMOVE_SYMBOL', payload: symbol });
      
      if (state.isConnected) {
        wsClient.unsubscribe(symbol);
      }
    }
  }, [state.isConnected, state.subscriptions]);

  // Get market data for a symbol
  const getMarketData = useCallback((symbol: string): MarketData | null => {
    return state.marketData[symbol] || null;
  }, [state.marketData]);

  // Get order book for a symbol
  const getOrderBook = useCallback((symbol: string): OrderBookData | null => {
    return state.orderBooks[symbol] || null;
  }, [state.orderBooks]);

  // Check if a symbol is subscribed
  const isSubscribed = useCallback((symbol: string): boolean => {
    return state.subscriptions.has(symbol);
  }, [state.subscriptions]);

  // Connect to WebSocket
  const connect = useCallback(async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'SET_ERROR', payload: null });
      
      await wsClient.connect();
      
      // Subscribe to all symbols in subscriptions
      state.subscriptions.forEach(symbol => {
        subscribe(symbol);
      });
      
      dispatch({ type: 'SET_CONNECTED', payload: true });
    } catch (error) {
      dispatch({ 
        type: 'SET_ERROR', 
        payload: error instanceof Error ? error.message : 'Failed to connect to WebSocket' 
      });
      dispatch({ type: 'SET_CONNECTED', payload: false });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [state.subscriptions, subscribe]);

  // Disconnect from WebSocket
  const disconnect = useCallback(() => {
    wsClient.disconnect();
    dispatch({ type: 'SET_CONNECTED', payload: false });
    dispatch({ type: 'CLEAR_DATA' });
  }, []);

  // Refresh all data
  const refreshAll = useCallback(async () => {
    if (!state.isConnected) return;
    
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      // Refresh order books for all subscribed symbols
      const promises = Array.from(state.subscriptions).map(async (symbol) => {
        try {
          const orderBook = await wsClient.getOrderBook(symbol);
          dispatch({ type: 'UPDATE_ORDER_BOOK', payload: { symbol, data: orderBook } });
        } catch (error) {
          console.error(`Failed to refresh order book for ${symbol}:`, error);
        }
      });
      
      await Promise.all(promises);
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [state.isConnected, state.subscriptions]);

  // Initialize WebSocket connection
  useEffect(() => {
    if (!autoConnect) return;
    
    const initConnection = async () => {
      try {
        dispatch({ type: 'SET_LOADING', payload: true });
        
        // Connect to WebSocket
        await wsClient.connect();
        
        // Set up event listeners
        wsClient.on('connected', () => {
          dispatch({ type: 'SET_CONNECTED', payload: true });
          dispatch({ type: 'SET_ERROR', payload: null });
          
          // Subscribe to initial symbols
          state.symbols.forEach(symbol => {
            subscribe(symbol);
          });
        });
        
        wsClient.on('disconnected', () => {
          dispatch({ type: 'SET_CONNECTED', payload: false });
        });
        
        wsClient.on('error', (errorData: { code: string; details: string; timestamp: string; reconnectAttempt?: number }) => {
          dispatch({ type: 'SET_ERROR', payload: errorData.details });
        });
        
        // Listen for order book updates
        wsClient.on('order_book', (data: { symbol: string; order_book: OrderBookData; timestamp: string }) => {
          if (state.subscriptions.has(data.symbol)) {
            dispatch({ type: 'UPDATE_ORDER_BOOK', payload: { symbol: data.symbol, data: data.order_book } });
          }
        });
        
      } catch (error) {
        dispatch({ 
          type: 'SET_ERROR', 
          payload: error instanceof Error ? error.message : 'Failed to initialize WebSocket connection' 
        });
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    };
    
    initConnection();
    
    return () => {
      // Clean up event listeners
      wsClient.off('connected', () => {});
      wsClient.off('disconnected', () => {});
      wsClient.off('error', () => {});
      wsClient.off('order_book', () => {});
      
      // Unsubscribe from all symbols
      state.subscriptions.forEach(symbol => {
        wsClient.unsubscribe(symbol);
      });
    };
  }, [autoConnect, state.symbols, state.subscriptions, subscribe]);

  // Auto-subscribe to symbols when they're added to subscriptions
  useEffect(() => {
    if (!state.isConnected) return;
    
    state.subscriptions.forEach(symbol => {
      if (!wsClient.getSubscribedSymbols().includes(symbol)) {
        subscribe(symbol);
      }
    });
  }, [state.isConnected, state.subscriptions, subscribe]);

  const contextValue: MarketDataContextType = {
    state,
    dispatch,
    subscribe,
    unsubscribe,
    getMarketData,
    getOrderBook,
    connect,
    disconnect,
    isSubscribed,
    refreshAll,
  };

  return (
    <MarketDataContext.Provider value={contextValue}>
      {children}
    </MarketDataContext.Provider>
  );
}

// Hook for using the market data context
export function useMarketDataContext() {
  const context = useContext(MarketDataContext);
  
  if (context === undefined) {
    throw new Error('useMarketDataContext must be used within a MarketDataProvider');
  }
  
  return context;
}

// Hook for market data of a specific symbol
export function useSymbolMarketData(symbol: string) {
  const { state, subscribe, unsubscribe, isSubscribed } = useMarketDataContext();
  
  const marketData = state.marketData[symbol] || null;
  const orderBook = state.orderBooks[symbol] || null;
  const subscribed = isSubscribed(symbol);
  
  // Auto-subscribe when symbol changes
  useEffect(() => {
    if (symbol && !subscribed) {
      subscribe(symbol);
    }
    
    return () => {
      if (symbol && subscribed) {
        unsubscribe(symbol);
      }
    };
  }, [symbol, subscribed, subscribe, unsubscribe]);
  
  return {
    marketData,
    orderBook,
    isConnected: state.isConnected,
    isLoading: state.isLoading,
    error: state.error,
    subscribed,
  };
}

// Hook for multiple symbols market data
export function useMultipleSymbolsMarketData(symbols: string[]) {
  const { state } = useMarketDataContext();
  
  const marketData: Record<string, MarketData | null> = {};
  const orderBooks: Record<string, OrderBookData | null> = {};
  
  symbols.forEach(symbol => {
    marketData[symbol] = state.marketData[symbol] || null;
    orderBooks[symbol] = state.orderBooks[symbol] || null;
  });
  
  return {
    marketData,
    orderBooks,
    isConnected: state.isConnected,
    isLoading: state.isLoading,
    error: state.error,
  };
}

// Hook for market data summary
export function useMarketDataSummary() {
  const { state } = useMarketDataContext();
  
  const totalSymbols = state.symbols.length;
  const subscribedSymbols = state.subscriptions.size;
  const hasData = Object.keys(state.marketData).length > 0;
  const hasOrderBooks = Object.keys(state.orderBooks).length > 0;
  
  // Calculate average spread
  const averageSpread = Object.values(state.marketData).reduce((acc, data) => {
    if (data) {
      return acc + data.spread;
    }
    return acc;
  }, 0) / (Object.values(state.marketData).filter(Boolean).length || 1);
  
  // Calculate total volume
  const totalVolume = Object.values(state.marketData).reduce((acc, data) => {
    if (data) {
      return acc + data.volume;
    }
    return acc;
  }, 0);
  
  return {
    totalSymbols,
    subscribedSymbols,
    hasData,
    hasOrderBooks,
    averageSpread,
    totalVolume,
    isConnected: state.isConnected,
    isLoading: state.isLoading,
    error: state.error,
  };
}
