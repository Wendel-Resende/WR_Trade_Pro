'use client';

import { useState, useEffect } from 'react';

// Lista padrão de ativos monitorados
const DEFAULT_SYMBOLS = ['EURUSD', 'USDJPY', 'BTCUSD', 'AUDUSD'];

export default function TickerBar() {
  const [symbols, setSymbols] = useState<string[]>(DEFAULT_SYMBOLS);
  const [newSymbol, setNewSymbol] = useState('');
  const [showAddSymbol, setShowAddSymbol] = useState(false);
  const [prices, setPrices] = useState<Record<string, { price: number; change: number }>>({});
  const [isPaused, setIsPaused] = useState(false);

  // Buscar dados de todos os símbolos via API
  useEffect(() => {
    const fetchAllPrices = async () => {
      try {
        const symbolsParam = symbols.join(',');
        const response = await fetch(`/api/market?symbols=${symbolsParam}`);
        
        if (response.ok) {
          const data = await response.json();
          console.log('[TICKER] Atualizando preços:', data);
          setPrices(data);
        }
      } catch (error) {
        // Silenciar erro - não quebrar o app
        console.debug('TickerBar: API não disponível, usando estado anterior');
      }
    };

    fetchAllPrices();
    
    // Atualizar a cada 5 segundos
    const interval = setInterval(fetchAllPrices, 5000);
    
    return () => clearInterval(interval);
  }, [symbols]);

  const handleAddSymbol = (e: React.FormEvent) => {
    e.preventDefault();
    const symbol = newSymbol.trim().toUpperCase();
    
    if (symbol && !symbols.includes(symbol)) {
      setSymbols([...symbols, symbol]);
      setNewSymbol('');
      setShowAddSymbol(false);
    }
  };

  const handleRemoveSymbol = (symbol: string) => {
    setSymbols(symbols.filter(s => s !== symbol));
  };

  const formatPrice = (price: number, symbol: string) => {
    if (!price || isNaN(price)) return '---';
    
    if (symbol.includes('JPY')) {
      return price.toFixed(2);
    } else if (symbol.includes('BTC')) {
      return price.toFixed(2);
    } else {
      return price.toFixed(4);
    }
  };

  const formatChange = (change: number) => {
    if (change === undefined || change === null || isNaN(change)) return '0.00%';
    const sign = change >= 0 ? '↑' : '↓';
    return `${sign} ${Math.abs(change).toFixed(2)}%`;
  };

  return (
    <div className="bg-surface/50 backdrop-blur-sm border-b border-gray-800">
      <div className="flex items-center justify-between px-4 py-1">
        {/* Ticker de preços responsivo com carrossel */}
        <div className="flex-1 overflow-hidden relative">
          <div 
            className="flex items-center gap-4 py-1 animate-scroll"
            style={{ animationPlayState: isPaused ? 'paused' : 'running' }}
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
          >
            {/* Primeira cópia */}
            {symbols.map((symbol) => {
              const data = prices[symbol];
              if (!data) return null;

              const isPositive = data.change >= 0;
              
              return (
                <div
                  key={`${symbol}-1`}
                  className="flex items-center gap-2 px-2 py-0.5 rounded hover:bg-surface/50 transition-colors cursor-pointer group relative min-w-[140px] text-xs flex-shrink-0"
                >
                  <span className="font-semibold text-secondary">
                    {symbol}
                  </span>
                  <span className="text-white">
                    {formatPrice(data.price, symbol)}
                  </span>
                  <span
                    className={`font-semibold ${
                      isPositive ? 'text-green-500' : 'text-red-500'
                    }`}
                  >
                    {formatChange(data.change)}
                  </span>

                  {/* Botão remover - aparece no hover */}
                  <button
                    onClick={() => handleRemoveSymbol(symbol)}
                    className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-[10px] text-white opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Remover"
                  >
                    ×
                  </button>
                </div>
              );
            })}
            
            {/* Segunda cópia para efeito contínuo */}
            {symbols.map((symbol) => {
              const data = prices[symbol];
              if (!data) return null;

              const isPositive = data.change >= 0;
              
              return (
                <div
                  key={`${symbol}-2`}
                  className="flex items-center gap-2 px-2 py-0.5 rounded hover:bg-surface/50 transition-colors cursor-pointer group relative min-w-[140px] text-xs flex-shrink-0"
                >
                  <span className="font-semibold text-secondary">
                    {symbol}
                  </span>
                  <span className="text-white">
                    {formatPrice(data.price, symbol)}
                  </span>
                  <span
                    className={`font-semibold ${
                      isPositive ? 'text-green-500' : 'text-red-500'
                    }`}
                  >
                    {formatChange(data.change)}
                  </span>

                  {/* Botão remover - aparece no hover */}
                  <button
                    onClick={() => handleRemoveSymbol(symbol)}
                    className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-[10px] text-white opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Remover"
                  >
                    ×
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Botão adicionar símbolo */}
        <div className="ml-2 flex-shrink-0">
          {!showAddSymbol ? (
            <button
              onClick={() => setShowAddSymbol(true)}
              className="px-3 py-0.5 bg-primary/20 border border-primary/50 text-primary rounded text-xs font-semibold hover:bg-primary/30 transition-colors"
              title="Adicionar novo ativo para monitorar"
            >
              +
            </button>
          ) : (
            <form onSubmit={handleAddSymbol} className="flex items-center gap-1">
              <input
                type="text"
                value={newSymbol}
                onChange={(e) => setNewSymbol(e.target.value)}
                placeholder="Ex: EURUSD"
                className="w-24 px-2 py-0.5 bg-surface border border-gray-600 rounded text-white text-xs focus:outline-none focus:border-primary"
                autoFocus
              />
              <button
                type="submit"
                className="px-2 py-0.5 bg-green-500/20 border border-green-500/50 text-green-500 rounded text-xs font-semibold hover:bg-green-500/30"
              >
                ✓
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowAddSymbol(false);
                  setNewSymbol('');
                }}
                className="px-2 py-0.5 bg-red-500/20 border border-red-500/50 text-red-500 rounded text-xs font-semibold hover:bg-red-500/30"
              >
                ✕
              </button>
            </form>
          )}  
        </div>
      </div>
    </div>
  );
}
