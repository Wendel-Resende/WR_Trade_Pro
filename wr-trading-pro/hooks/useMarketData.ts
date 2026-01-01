'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { wsClient } from '@/lib/websocket/client';
import { MarketData } from '@/lib/websocket/types';

// Cache global para candles (compartilhado entre instâncias)
const candlesCache = new Map<string, any[]>();
const candlesPromises = new Map<string, Promise<any[]>>();

/**
 * Obter candles do cache ou buscar do servidor
 */
async function getCandlesWithCache(symbol: string, timeframe: string = 'M5', count: number = 100): Promise<any[]> {
  const cacheKey = `${symbol}_${timeframe}_${count}`;
  
  // Se já tem promise em andamento, reutilizar
  if (candlesPromises.has(cacheKey)) {
    return candlesPromises.get(cacheKey)!;
  }
  
  // Se já tem cache válido, retornar
  if (candlesCache.has(cacheKey)) {
    return candlesCache.get(cacheKey)!;
  }
  
  // Criar nova promise
  const promise = wsClient.getCandles(symbol, timeframe, count)
    .then(candles => {
      // Salvar no cache
      candlesCache.set(cacheKey, candles);
      // Remover promise após completar
      candlesPromises.delete(cacheKey);
      // Invalidar cache após 30 segundos
      setTimeout(() => {
        candlesCache.delete(cacheKey);
      }, 30000);
      return candles;
    })
    .catch(error => {
      // Remover promise em caso de erro
      candlesPromises.delete(cacheKey);
      throw error;
    });
  
  candlesPromises.set(cacheKey, promise);
  return promise;
}

export interface TickData extends MarketData {}

export interface UseMarketDataOptions {
  autoConnect?: boolean;
  autoSubscribe?: boolean;
  onData?: (data: TickData) => void;
  onError?: (error: string) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
}

/**
 * Hook for real-time market data (optimized version)
 * @param symbol - Trading symbol (e.g., 'EURUSD')
 * @returns Market data and connection state
 */
export function useMarketData(symbol?: string) {
  const [data, setData] = useState<any>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const callbackRef = useRef<(tickData: any) => void>(() => {});
  const instanceId = useRef(Math.random()); // ID único para debug
  const isMountingRef = useRef(true);

  // Memoizar callback para evitar re-subscriptions
  useEffect(() => {
    callbackRef.current = (tickData: any) => {
      setData((prev: any) => {
        // Preservar candles existentes, atualizar apenas dados de tick
        return {
          ...prev,
          ...tickData
        };
      });
      setIsConnected(true);
    };
  }, [symbol]);

  useEffect(() => {
    if (!symbol) return;

    isMountingRef.current = true;

    // Wrapper estável para callback
    const stableCallback = (tickData: any) => {
      callbackRef.current?.(tickData);
    };

    // Ouvir eventos de candles do Socket.IO
    const handleCandles = (candlesData: { symbol: string; timeframe: string; candles: any[] }) => {
      // Se for para este símbolo, salvar no estado
      if (candlesData.symbol === symbol && candlesData.candles && candlesData.candles.length > 0) {
        // Converter time de string ISO para timestamp (milissegundos)
        const formattedCandles = candlesData.candles.map((candle: any) => ({
          ...candle,
          time: new Date(candle.time).getTime()
        }));
        
        setData((prev: any) => {
          const newData = {
            ...prev,
            candles: formattedCandles,
            symbol: candlesData.symbol
          };
          return newData;
        });
      }
    };

    // Registrar listeners
    wsClient.on('candles', handleCandles);
    wsClient.subscribe(symbol, stableCallback);

    // Buscar candles históricos (usando cache compartilhado) - apenas se conectado
    const fetchCandles = () => {
      // Verificar se está conectado antes de buscar
      if (!wsClient.getIsConnected()) {
        return;
      }
      
      getCandlesWithCache(symbol, 'M5', 100)
        .then(candles => {
          if (candles.length > 0) {
            // Converter time de string ISO para timestamp (milissegundos)
            const formattedCandles = candles.map((candle: any) => ({
              ...candle,
              time: new Date(candle.time).getTime()
            }));
            
            setData((prev: any) => ({
              ...prev,
              candles: formattedCandles,
              symbol
            }));
          }
        })
        .catch(err => {
          // Silenciar erro se não estiver conectado
          if (!(err as Error).message.includes('Not connected')) {
            setError(err);
          }
        });
    };

    // Adicionar delay inicial para aguardar conexão
    const delayTime = wsClient.getIsConnected() ? Math.random() * 100 : 2000; // 2s se não conectado
    const timeoutId = setTimeout(() => {
      fetchCandles();
      
      // Se ainda não conectado, tentar novamente após 2 segundos
      if (!wsClient.getIsConnected()) {
        setTimeout(fetchCandles, 2000);
      }
    }, delayTime);

    // Cleanup: unsubscribir quando componente desmontar
    return () => {
      clearTimeout(timeoutId);
      wsClient.unsubscribe(symbol, stableCallback);
      wsClient.off('candles', handleCandles);
    };
  }, [symbol]); // Apenas re-executar se símbolo mudar

  // Log estado atual para debug (apenas em desenvolvimento)
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      // Log mínimo para debug
    }
  }, [data, symbol, isConnected, error]);

  return { data, isConnected, error };
}

// Singleton para gerenciar múltiplas inscrições
const multiSymbolManager = {
  subscriptions: new Map<string, Set<(data: TickData) => void>>(),
  
  subscribe(symbol: string, callback: (data: TickData) => void): void {
    if (!this.subscriptions.has(symbol)) {
      this.subscriptions.set(symbol, new Set());
      wsClient.subscribe(symbol, (data: TickData) => {
        const callbacks = this.subscriptions.get(symbol);
        if (callbacks) {
          callbacks.forEach(cb => cb(data));
        }
      });
    }
    this.subscriptions.get(symbol)!.add(callback);
  },
  
  unsubscribe(symbol: string, callback: (data: TickData) => void): void {
    const callbacks = this.subscriptions.get(symbol);
    if (callbacks) {
      callbacks.delete(callback);
      if (callbacks.size === 0) {
        this.subscriptions.delete(symbol);
        wsClient.unsubscribe(symbol, undefined);
      }
    }
  },
  
  unsubscribeAll(symbol: string): void {
    this.subscriptions.delete(symbol);
    wsClient.unsubscribe(symbol, undefined);
  }
};

/**
 * Hook for multiple symbols market data
 */
export function useMultipleMarketData(
  symbols: string[],
  options: Omit<UseMarketDataOptions, 'autoSubscribe'> = {}
): Record<string, TickData | null> {
  const [data, setData] = useState<Record<string, TickData | null>>({});
  const isMountedRef = useRef(true);
  
  // Initialize data object
  useEffect(() => {
    const initialData: Record<string, TickData | null> = {};
    symbols.forEach(symbol => {
      initialData[symbol] = null;
    });
    setData(initialData);
  }, [symbols]);
  
  // Listen for tick data from all symbols
  useEffect(() => {
    isMountedRef.current = true;
    
    const handleTick = (tickData: TickData) => {
      if (!isMountedRef.current) return;
      setData((prev: any) => ({
        ...prev,
        [tickData.symbol]: tickData,
      }));
    };
    
    // Subscribe to all symbols via manager
    symbols.forEach(symbol => {
      multiSymbolManager.subscribe(symbol, handleTick);
    });
    
    return () => {
      isMountedRef.current = false;
      // Cleanup on unmount
      symbols.forEach(symbol => {
        multiSymbolManager.unsubscribe(symbol, handleTick);
      });
    };
  }, [symbols]);
  
  return data;
}

/**
 * Hook for market summary data
 */
export function useMarketSummary() {
  const [summary, setSummary] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    const handleMarketSummary = (data: any) => {
      setSummary(data.summary);
      setIsLoading(false);
    };
    
    const handleError = (errorData: any) => {
      setError(errorData.message || 'Erro ao obter resumo do mercado');
      setIsLoading(false);
    };
    
    // Listen for market summary updates
    wsClient.on('market_summary', handleMarketSummary);
    wsClient.on('error', handleError);
    
    return () => {
      wsClient.off('market_summary', handleMarketSummary);
      wsClient.off('error', handleError);
    };
  }, []);
  
  return { summary, isLoading, error };
}

/**
 * Hook for account information
 */
export function useAccountInfo() {
  const [accountInfo, setAccountInfo] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const fetchAccountInfo = useCallback(async () => {
    try {
      setIsLoading(true);
      const info = await wsClient.getAccountInfo();
      setAccountInfo(info);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch account info');
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  useEffect(() => {
    // Listen for account updates
    const handleAccountInfo = (data: any) => {
      setAccountInfo(data.account);
      setIsLoading(false);
    };
    
    wsClient.on('account_info', handleAccountInfo);
    
    // Fetch initial account info
    if (wsClient.getIsConnected()) {
      fetchAccountInfo();
    }
    
    return () => {
      wsClient.off('account_info', handleAccountInfo);
    };
  }, [fetchAccountInfo]);
  
  return { accountInfo, isLoading, error, refetch: fetchAccountInfo };
}
