/**
 * React hook for real-time order book data from WebSocket
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { wsClient } from '@/lib/websocket/client';
import { OrderBookData } from '@/lib/websocket/types';

export interface UseOrderBookReturn {
  data: OrderBookData | null;
  isConnected: boolean;
  isLoading: boolean;
  error: string | null;
  subscribe: (symbol: string, depth?: number) => void;
  unsubscribe: () => void;
  refetch: () => Promise<void>;
}

export interface UseOrderBookOptions {
  autoConnect?: boolean;
  autoSubscribe?: boolean;
  depth?: number;
  onData?: (data: OrderBookData) => void;
  onError?: (error: string) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
}

/**
 * Hook for real-time order book data
 * @param symbol - Trading symbol (e.g., 'EURUSD')
 * @param options - Configuration options
 * @returns Order book data and connection state
 */
export function useOrderBook(
  symbol?: string,
  options: UseOrderBookOptions = {}
): UseOrderBookReturn {
  const {
    autoConnect = true,
    autoSubscribe = true,
    depth = 10,
    onData,
    onError,
    onConnect,
    onDisconnect,
  } = options;

  const [data, setData] = useState<OrderBookData | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const currentSymbolRef = useRef<string | undefined>(symbol);
  const currentDepthRef = useRef<number>(depth);
  const isMountedRef = useRef(true);

  // Handle incoming order book data
  const handleOrderBookData = useCallback((orderBookData: OrderBookData) => {
    if (!isMountedRef.current) return;
    
    setData(orderBookData);
    setIsLoading(false);
    setError(null);
    
    if (onData) {
      onData(orderBookData);
    }
  }, [onData]);

  // Handle WebSocket connection events
  const handleConnect = useCallback(() => {
    if (!isMountedRef.current) return;
    
    setIsConnected(true);
    setError(null);
    
    if (onConnect) {
      onConnect();
    }
    
    // Auto-subscribe if symbol is provided
    if (autoSubscribe && currentSymbolRef.current) {
      fetchOrderBook(currentSymbolRef.current, currentDepthRef.current);
    }
  }, [autoSubscribe, onConnect]);

  const handleDisconnect = useCallback(() => {
    if (!isMountedRef.current) return;
    
    setIsConnected(false);
    setIsLoading(true);
    
    if (onDisconnect) {
      onDisconnect();
    }
  }, [onDisconnect]);

  const handleError = useCallback((errorData: { code: string; details: string; timestamp: string; reconnectAttempt?: number }) => {
    if (!isMountedRef.current) return;
    
    setError(errorData.details);
    setIsLoading(false);
    
    if (onError) {
      onError(errorData.details);
    }
  }, [onError]);

  // Fetch order book data
  const fetchOrderBook = useCallback(async (fetchSymbol: string, fetchDepth: number = depth) => {
    if (!isMountedRef.current) return;
    
    try {
      setIsLoading(true);
      setError(null);
      
      const orderBook = await wsClient.getOrderBook(fetchSymbol, fetchDepth);
      handleOrderBookData(orderBook);
    } catch (err) {
      if (!isMountedRef.current) return;
      
      setError(err instanceof Error ? err.message : 'Failed to fetch order book');
      setIsLoading(false);
    }
  }, [depth, handleOrderBookData]);

  // Subscribe to a symbol
  const subscribe = useCallback((newSymbol: string, newDepth?: number) => {
    if (!isMountedRef.current) return;
    
    // Update current symbol and depth
    currentSymbolRef.current = newSymbol;
    if (newDepth !== undefined) {
      currentDepthRef.current = newDepth;
    }
    
    setIsLoading(true);
    setError(null);
    
    // Fetch order book if connected
    if (wsClient.getIsConnected()) {
      fetchOrderBook(newSymbol, newDepth || currentDepthRef.current);
    }
  }, [fetchOrderBook]);

  // Unsubscribe from current symbol
  const unsubscribe = useCallback(() => {
    if (!isMountedRef.current) return;
    
    currentSymbolRef.current = undefined;
    setData(null);
    setIsLoading(false);
  }, []);

  // Refetch current order book
  const refetch = useCallback(async () => {
    if (!currentSymbolRef.current) return;
    
    await fetchOrderBook(currentSymbolRef.current, currentDepthRef.current);
  }, [fetchOrderBook]);

  // Initialize WebSocket connection
  useEffect(() => {
    isMountedRef.current = true;
    
    const initConnection = async () => {
      if (!autoConnect) return;
      
      try {
        setIsLoading(true);
        
        // Connect to WebSocket
        if (!wsClient.getIsConnected()) {
          await wsClient.connect();
        }
        
        // Set up event listeners
        wsClient.on('connected', handleConnect);
        wsClient.on('disconnected', handleDisconnect);
        wsClient.on('error', handleError);
        
        // Listen for order book updates
        wsClient.on('order_book', (updateData: { symbol: string; order_book: OrderBookData; timestamp: string }) => {
          if (updateData.symbol === currentSymbolRef.current) {
            handleOrderBookData(updateData.order_book);
          }
        });
        
        // Auto-fetch if symbol is provided
        if (autoSubscribe && symbol) {
          currentSymbolRef.current = symbol;
          await fetchOrderBook(symbol, depth);
        }
      } catch (err) {
        if (!isMountedRef.current) return;
        
        setError(err instanceof Error ? err.message : 'Failed to connect to WebSocket');
        setIsLoading(false);
      }
    };
    
    initConnection();
    
    return () => {
      isMountedRef.current = false;
      
      // Clean up event listeners
      wsClient.off('connected', handleConnect);
      wsClient.off('disconnected', handleDisconnect);
      wsClient.off('error', handleError);
      wsClient.off('order_book', handleOrderBookData as any);
    };
  }, [autoConnect, autoSubscribe, symbol, depth, handleConnect, handleDisconnect, handleError, handleOrderBookData, fetchOrderBook]);

  // Handle symbol or depth changes
  useEffect(() => {
    if (!isMountedRef.current || !symbol || !autoSubscribe) return;
    
    // If symbol or depth changed, update subscription
    if (currentSymbolRef.current !== symbol || currentDepthRef.current !== depth) {
      subscribe(symbol, depth);
    }
  }, [symbol, depth, autoSubscribe, subscribe]);

  return {
    data,
    isConnected,
    isLoading,
    error,
    subscribe,
    unsubscribe,
    refetch,
  };
}

/**
 * Calculate order book statistics
 */
export function useOrderBookStats(orderBook: OrderBookData | null) {
  const [stats, setStats] = useState({
    totalBidVolume: 0,
    totalAskVolume: 0,
    bidAskRatio: 0,
    weightedBidPrice: 0,
    weightedAskPrice: 0,
    marketImbalance: 0,
  });

  useEffect(() => {
    if (!orderBook) {
      setStats({
        totalBidVolume: 0,
        totalAskVolume: 0,
        bidAskRatio: 0,
        weightedBidPrice: 0,
        weightedAskPrice: 0,
        marketImbalance: 0,
      });
      return;
    }

    // Calculate total volumes
    const totalBidVolume = orderBook.bids.reduce((sum, bid) => sum + bid.volume, 0);
    const totalAskVolume = orderBook.asks.reduce((sum, ask) => sum + ask.volume, 0);
    
    // Calculate weighted prices
    const weightedBidPrice = orderBook.bids.reduce((sum, bid) => sum + (bid.price * bid.volume), 0) / totalBidVolume || 0;
    const weightedAskPrice = orderBook.asks.reduce((sum, ask) => sum + (ask.price * ask.volume), 0) / totalAskVolume || 0;
    
    // Calculate ratios and imbalance
    const bidAskRatio = totalBidVolume / (totalAskVolume || 1);
    const marketImbalance = (totalBidVolume - totalAskVolume) / (totalBidVolume + totalAskVolume || 1);

    setStats({
      totalBidVolume,
      totalAskVolume,
      bidAskRatio,
      weightedBidPrice,
      weightedAskPrice,
      marketImbalance,
    });
  }, [orderBook]);

  return stats;
}

/**
 * Hook for order book depth visualization
 */
export function useOrderBookDepth(orderBook: OrderBookData | null, levels: number = 10) {
  const [depthData, setDepthData] = useState({
    bids: [] as Array<{ price: number; volume: number; cumulativeVolume: number; percentage: number }>,
    asks: [] as Array<{ price: number; volume: number; cumulativeVolume: number; percentage: number }>,
    maxVolume: 0,
  });

  useEffect(() => {
    if (!orderBook) {
      setDepthData({
        bids: [],
        asks: [],
        maxVolume: 0,
      });
      return;
    }

    // Sort bids descending (highest price first)
    const sortedBids = [...orderBook.bids]
      .sort((a, b) => b.price - a.price)
      .slice(0, levels);
    
    // Sort asks ascending (lowest price first)
    const sortedAsks = [...orderBook.asks]
      .sort((a, b) => a.price - b.price)
      .slice(0, levels);

    // Calculate cumulative volumes
    let bidCumulative = 0;
    const bidsWithCumulative = sortedBids.map(bid => {
      bidCumulative += bid.volume;
      return {
        ...bid,
        cumulativeVolume: bidCumulative,
        percentage: 0, // Will be calculated after max volume
      };
    });

    let askCumulative = 0;
    const asksWithCumulative = sortedAsks.map(ask => {
      askCumulative += ask.volume;
      return {
        ...ask,
        cumulativeVolume: askCumulative,
        percentage: 0, // Will be calculated after max volume
      };
    });

    // Find max volume for percentage calculation
    const maxVolume = Math.max(bidCumulative, askCumulative);

    // Calculate percentages
    const bidsWithPercentage = bidsWithCumulative.map(bid => ({
      ...bid,
      percentage: maxVolume > 0 ? (bid.cumulativeVolume / maxVolume) * 100 : 0,
    }));

    const asksWithPercentage = asksWithCumulative.map(ask => ({
      ...ask,
      percentage: maxVolume > 0 ? (ask.cumulativeVolume / maxVolume) * 100 : 0,
    }));

    setDepthData({
      bids: bidsWithPercentage,
      asks: asksWithPercentage,
      maxVolume,
    });
  }, [orderBook, levels]);

  return depthData;
}

/**
 * Hook for order book spread analysis
 */
export function useOrderBookSpread(orderBook: OrderBookData | null) {
  const [spreadAnalysis, setSpreadAnalysis] = useState({
    spread: 0,
    spreadPercentage: 0,
    midPrice: 0,
    isWideSpread: false,
    spreadLevel: 'normal' as 'narrow' | 'normal' | 'wide',
  });

  useEffect(() => {
    if (!orderBook) {
      setSpreadAnalysis({
        spread: 0,
        spreadPercentage: 0,
        midPrice: 0,
        isWideSpread: false,
        spreadLevel: 'normal',
      });
      return;
    }

    const spread = orderBook.spread;
    const midPrice = orderBook.midPrice;
    const spreadPercentage = midPrice > 0 ? (spread / midPrice) * 100 : 0;
    
    // Determine spread level
    let spreadLevel: 'narrow' | 'normal' | 'wide' = 'normal';
    let isWideSpread = false;
    
    if (spreadPercentage < 0.01) {
      spreadLevel = 'narrow';
    } else if (spreadPercentage > 0.1) {
      spreadLevel = 'wide';
      isWideSpread = true;
    }

    setSpreadAnalysis({
      spread,
      spreadPercentage,
      midPrice,
      isWideSpread,
      spreadLevel,
    });
  }, [orderBook]);

  return spreadAnalysis;
}
