'use client';

import { useEffect, useState } from 'react';
import { wsClient } from '@/lib/websocket/client';

interface OrderBookProps {
  symbol: string;
}

export default function OrderBook({ symbol }: OrderBookProps) {
  const [orderBook, setOrderBook] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchOrderBook = async () => {
      if (!wsClient.getIsConnected()) {
        return;
      }
      
      try {
        setIsLoading(true);
        const data = await wsClient.getOrderBook(symbol, 10);
        setOrderBook(data);
      } catch (error) {
        if (!(error as Error).message.includes('Not connected')) {
          console.error('Erro ao buscar order book:', error);
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrderBook();
    
    const interval = setInterval(() => {
      if (wsClient.getIsConnected()) {
        fetchOrderBook();
      }
    }, 5000);
    
    return () => clearInterval(interval);
  }, [symbol]);

  if (isLoading) {
    return (
      <div className="neon-card p-3">
        <h3 className="text-xs font-bold text-cyan-400 mb-2">📊 Order Book</h3>
        <div className="text-center text-gray-500 text-xs">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="neon-card p-3">
      <h3 className="text-xs font-bold text-cyan-400 mb-2">📊 Order Book - {symbol}</h3>
      
      <div className="grid grid-cols-2 gap-2">
        {/* Bids */}
        <div>
          <div className="text-[10px] text-success font-semibold mb-1">BIDS</div>
          <div className="space-y-0.5">
            {orderBook?.bids?.slice(0, 8).map((bid: any, i: number) => (
              <div key={i} className="flex justify-between text-[10px]">
                <span className="text-success" suppressHydrationWarning>
                  {bid.price.toFixed(symbol.includes('JPY') ? 2 : 4)}
                </span>
                <span className="text-gray-400" suppressHydrationWarning>
                  {(bid.volume / 1000000).toFixed(2)}M
                </span>
              </div>
            )) || <div className="text-gray-500 text-[10px]">Sem dados</div>}
          </div>
        </div>

        {/* Asks */}
        <div>
          <div className="text-[10px] text-danger font-semibold mb-1">ASKS</div>
          <div className="space-y-0.5">
            {orderBook?.asks?.slice(0, 8).map((ask: any, i: number) => (
              <div key={i} className="flex justify-between text-[10px]">
                <span className="text-danger" suppressHydrationWarning>
                  {ask.price.toFixed(symbol.includes('JPY') ? 2 : 4)}
                </span>
                <span className="text-gray-400" suppressHydrationWarning>
                  {(ask.volume / 1000000).toFixed(2)}M
                </span>
              </div>
            )) || <div className="text-gray-500 text-[10px]">Sem dados</div>}
          </div>
        </div>
      </div>
      
      {orderBook && (
        <div className="mt-2 pt-2 border-t border-gray-700 text-[10px] text-gray-500">
          <div className="flex justify-between">
            <span>Spread:</span>
            <span suppressHydrationWarning>
              {orderBook.spread?.toFixed(symbol.includes('JPY') ? 2 : 5) || 'N/A'}
            </span>
          </div>
          <div className="flex justify-between">
            <span>Mid:</span>
            <span suppressHydrationWarning>
              {orderBook.midPrice?.toFixed(symbol.includes('JPY') ? 2 : 4) || 'N/A'}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
