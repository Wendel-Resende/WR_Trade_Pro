'use client';

import React, { useState } from 'react';
import { ChevronDown, Wifi, WifiOff } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SymbolOption {
  value: string;
  label: string;
  category: 'forex' | 'crypto' | 'stocks';
  icon?: string;
}

const SYMBOL_OPTIONS: SymbolOption[] = [
  // Forex
  { value: 'EURUSD', label: 'EUR/USD', category: 'forex', icon: '🇪🇺🇺🇸' },
  { value: 'GBPUSD', label: 'GBP/USD', category: 'forex', icon: '🇬🇧🇺🇸' },
  { value: 'USDJPY', label: 'USD/JPY', category: 'forex', icon: '🇺🇸🇯🇵' },
  { value: 'AUDUSD', label: 'AUD/USD', category: 'forex', icon: '🇦🇺🇺🇸' },
  // Crypto
  { value: 'BTCUSD', label: 'BTC/USD', category: 'crypto', icon: '₿' },
  { value: 'ETHUSD', label: 'ETH/USD', category: 'crypto', icon: 'Ξ' },
  // Stocks (se disponível no MT5)
  { value: 'AAPL', label: 'Apple Inc.', category: 'stocks', icon: '🍎' },
  { value: 'GOOGL', label: 'Alphabet Inc.', category: 'stocks', icon: '🔍' },
  { value: 'MSFT', label: 'Microsoft Corp.', category: 'stocks', icon: '🪟' },
];

interface SymbolSelectorProps {
  value: string;
  onChange: (symbol: string) => void;
  isConnected?: boolean;
  className?: string;
}

export function SymbolSelector({
  value,
  onChange,
  isConnected = false,
  className,
}: SymbolSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const selectedSymbol = SYMBOL_OPTIONS.find(opt => opt.value === value) || SYMBOL_OPTIONS[0];

  const handleSelect = (symbol: string) => {
    onChange(symbol);
    setIsOpen(false);
  };

  const getCategoryColor = (category: SymbolOption['category']) => {
    switch (category) {
      case 'forex': return 'border-blue-500/50 bg-blue-500/10 text-blue-400';
      case 'crypto': return 'border-yellow-500/50 bg-yellow-500/10 text-yellow-400';
      case 'stocks': return 'border-green-500/50 bg-green-500/10 text-green-400';
      default: return 'border-gray-500/50 bg-gray-500/10 text-gray-400';
    }
  };

  return (
    <div className={cn('relative', className)}>
      {/* Botão principal */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'flex items-center justify-between w-full px-4 py-3',
          'bg-black/50 backdrop-blur-sm',
          'border-2 border-cyan-500/30 rounded-lg',
          'hover:border-cyan-500/50 transition-all duration-300',
          'group'
        )}
      >
        <div className="flex items-center gap-3">
          {/* Status da conexão */}
          <div className="relative">
            <div className={cn(
              'w-3 h-3 rounded-full',
              isConnected 
                ? 'bg-green-500 animate-pulse' 
                : 'bg-red-500'
            )} />
            <div className={cn(
              'absolute inset-0 rounded-full',
              isConnected 
                ? 'bg-green-500 animate-ping' 
                : 'bg-red-500'
            )} />
          </div>

          {/* Símbolo selecionado */}
          <div className="flex items-center gap-2">
            <span className="text-xl">{selectedSymbol.icon}</span>
            <div className="text-left">
              <div className="font-bold text-white text-lg">{selectedSymbol.value}</div>
              <div className="text-xs text-gray-400">{selectedSymbol.label}</div>
            </div>
          </div>
        </div>

        {/* Ícone dropdown */}
        <ChevronDown className={cn(
          'w-5 h-5 text-cyan-400 transition-transform duration-300',
          isOpen && 'rotate-180'
        )} />
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 z-50">
          <div className="bg-gray-900/95 backdrop-blur-xl border-2 border-cyan-500/30 rounded-lg shadow-2xl shadow-cyan-500/20 overflow-hidden">
            {/* Cabeçalho */}
            <div className="p-3 border-b border-gray-800">
              <div className="flex items-center justify-between">
                <div className="text-sm font-semibold text-cyan-300">Selecionar Ativo</div>
                <div className="flex items-center gap-2">
                  <div className={cn(
                    'flex items-center gap-1 text-xs',
                    isConnected ? 'text-green-400' : 'text-red-400'
                  )}>
                    {isConnected ? (
                      <>
                        <Wifi className="w-3 h-3" />
                        <span>Conectado</span>
                      </>
                    ) : (
                      <>
                        <WifiOff className="w-3 h-3" />
                        <span>Desconectado</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Lista de opções */}
            <div className="max-h-64 overflow-y-auto">
              {/* Forex */}
              <div className="p-2">
                <div className="text-xs uppercase text-gray-500 px-2 py-1">Forex</div>
                {SYMBOL_OPTIONS.filter(opt => opt.category === 'forex').map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => handleSelect(option.value)}
                    className={cn(
                      'flex items-center gap-3 w-full px-3 py-2 rounded-lg',
                      'hover:bg-blue-500/10 transition-colors',
                      value === option.value && 'bg-blue-500/20 border border-blue-500/30'
                    )}
                  >
                    <span className="text-xl">{option.icon}</span>
                    <div className="text-left flex-1">
                      <div className="font-medium text-white">{option.value}</div>
                      <div className="text-xs text-gray-400">{option.label}</div>
                    </div>
                    {value === option.value && (
                      <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                    )}
                  </button>
                ))}
              </div>

              {/* Crypto */}
              <div className="p-2 border-t border-gray-800">
                <div className="text-xs uppercase text-gray-500 px-2 py-1">Crypto</div>
                {SYMBOL_OPTIONS.filter(opt => opt.category === 'crypto').map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => handleSelect(option.value)}
                    className={cn(
                      'flex items-center gap-3 w-full px-3 py-2 rounded-lg',
                      'hover:bg-yellow-500/10 transition-colors',
                      value === option.value && 'bg-yellow-500/20 border border-yellow-500/30'
                    )}
                  >
                    <span className="text-xl">{option.icon}</span>
                    <div className="text-left flex-1">
                      <div className="font-medium text-white">{option.value}</div>
                      <div className="text-xs text-gray-400">{option.label}</div>
                    </div>
                    {value === option.value && (
                      <div className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse" />
                    )}
                  </button>
                ))}
              </div>

              {/* Stocks */}
              <div className="p-2 border-t border-gray-800">
                <div className="text-xs uppercase text-gray-500 px-2 py-1">Stocks</div>
                {SYMBOL_OPTIONS.filter(opt => opt.category === 'stocks').map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => handleSelect(option.value)}
                    className={cn(
                      'flex items-center gap-3 w-full px-3 py-2 rounded-lg',
                      'hover:bg-green-500/10 transition-colors',
                      value === option.value && 'bg-green-500/20 border border-green-500/30'
                    )}
                  >
                    <span className="text-xl">{option.icon}</span>
                    <div className="text-left flex-1">
                      <div className="font-medium text-white">{option.value}</div>
                      <div className="text-xs text-gray-400">{option.label}</div>
                    </div>
                    {value === option.value && (
                      <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Rodapé */}
            <div className="p-3 border-t border-gray-800 bg-black/50">
              <div className="text-xs text-gray-400 text-center">
                Dados em tempo real via MT5 • Atualização: 100ms
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Overlay para fechar */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
}
