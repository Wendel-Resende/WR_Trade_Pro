'use client';

import { useState } from 'react';
import PredictionChart from '@/components/dashboard/prediction-chart';
import OrderBook from '@/components/dashboard/order-book';
import ModelStatusCard from '@/components/dashboard/model-status-card';
import PortfolioSummaryCards from '@/components/dashboard/cards/portfolio-summary-cards';
import { usePricePrediction } from '@/hooks/usePricePrediction';
import { useMarketData } from '@/hooks/useMarketData';

const AVAILABLE_SYMBOLS = [
  { value: 'EURUSD', label: 'EUR/USD', type: 'forex' },
  { value: 'GBPUSD', label: 'GBP/USD', type: 'forex' },
  { value: 'USDJPY', label: 'USD/JPY', type: 'forex' },
  { value: 'AUDUSD', label: 'AUD/USD', type: 'forex' },
  { value: 'BTCUSD', label: 'BTC/USD', type: 'crypto' },
  { value: 'ETHUSD', label: 'ETH/USD', type: 'crypto' },
];

const TIMEFRAMES = [
  { value: 'hourly', label: '1 Hora', icon: '⏱️' },
  { value: 'daily', label: '1 Dia', icon: '📅' },
  { value: 'weekly', label: '1 Semana', icon: '📆' },
  { value: 'yearly', label: '1 Ano', icon: '🗓️' },
];

export default function DashboardPage() {
  const [selectedSymbol, setSelectedSymbol] = useState('EURUSD');
  
  const { data: marketData, isConnected } = useMarketData(selectedSymbol);
  
  const candles = marketData?.candles || [];
  
  const { 
    prediction, 
    metrics, 
    isLoading, 
    isTraining,
    error,
    selectedTimeframe,
    setSelectedTimeframe,
    trainModel,
    predict: makePrediction,
    lastTrainedAt
  } = usePricePrediction(selectedSymbol, candles);

  return (
    <div className="space-y-3">
      {/* HEADER */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-primary">Dashboard</h1>
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-success animate-pulse' : 'bg-danger'}`}></div>
            <span className={`text-xs font-semibold ${isConnected ? 'text-success' : 'text-danger'}`}>
              {isConnected ? 'CONECTADO' : 'DESCONECTADO'}
            </span>
          </div>
        </div>
        
        {/* CONTROLES */}
        <div className="neon-card p-2">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2 w-full">
            {/* Seletor de Ativo */}
            <div>
              <label className="block text-[10px] text-gray-400 mb-1">Ativo:</label>
              <select
                value={selectedSymbol}
                onChange={(e) => setSelectedSymbol(e.target.value)}
                className="w-full bg-surface border border-secondary/50 rounded px-2 py-1 text-xs text-secondary font-semibold focus:outline-none focus:border-secondary"
              >
                <optgroup label="Forex">
                  {AVAILABLE_SYMBOLS.filter(s => s.type === 'forex').map(symbol => (
                    <option key={symbol.value} value={symbol.value}>{symbol.label}</option>
                  ))}
                </optgroup>
                <optgroup label="Crypto">
                  {AVAILABLE_SYMBOLS.filter(s => s.type === 'crypto').map(symbol => (
                    <option key={symbol.value} value={symbol.value}>{symbol.label}</option>
                  ))}
                </optgroup>
              </select>
            </div>
            
            {/* Seletor de Timeframe */}
            <div>
              <label className="block text-[10px] text-gray-400 mb-1">Horizonte:</label>
              <select
                value={selectedTimeframe}
                onChange={(e) => setSelectedTimeframe(e.target.value as any)}
                className="w-full bg-surface border border-secondary/50 rounded px-2 py-1 text-xs text-secondary font-semibold focus:outline-none focus:border-secondary"
              >
                {TIMEFRAMES.map(tf => (
                  <option key={tf.value} value={tf.value}>{tf.icon} {tf.label}</option>
                ))}
              </select>
            </div>
            
            {/* Botão */}
            <div>
              <label className="block text-[10px] text-gray-400 mb-1">Ação:</label>
              <button
                onClick={() => makePrediction()}
                className="w-full px-2 py-1 bg-gradient-to-r from-pink-500 to-purple-500 rounded hover:from-pink-600 hover:to-purple-600 transition-all text-xs text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? '⏳ Prevendo...' : isTraining ? '🤖 Treinando...' : '🔮 Prever'}
              </button>
            </div>
          </div>
          
          {/* Status */}
          <div className="mt-2 flex items-center gap-3 text-[10px]">
            <div className={candles.length >= 100 ? 'text-success' : 'text-yellow-400'}>
              📊 {candles.length} candles {candles.length >= 100 ? '✅' : `(${100 - candles.length} faltando)`}
            </div>
            {lastTrainedAt && (
              <div className="text-gray-400">
                🤖 Treino: {new Date(lastTrainedAt).toLocaleTimeString('pt-BR')}
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* CARDS DE RESUMO */}
      <PortfolioSummaryCards />
      
      {/* GRÁFICO */}
      <PredictionChart
        symbol={selectedSymbol}
        historicalData={candles}
        prediction={prediction || undefined}
        onRetrain={() => makePrediction()}
      />
      
      {/* GRID INFERIOR */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 w-full">
        <ModelStatusCard
          metrics={metrics || undefined}
          isTraining={isTraining}
          lastTrainedAt={lastTrainedAt || undefined}
          onRetrain={trainModel}
        />
        
        {prediction ? (
          <div className="neon-card p-3">
            <h3 className="text-sm font-bold text-pink-400 mb-2">🔮 Previsão</h3>
            <div className="text-center">
              <div className="text-2xl font-bold text-pink-400 mb-1">
                ${prediction.price.toFixed(selectedSymbol.includes('JPY') ? 2 : 4)}
              </div>
              <div className="text-[10px] text-gray-400 mb-2">
                {TIMEFRAMES.find(tf => tf.value === selectedTimeframe)?.label}
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-gray-400">Confiança:</span>
                  <span className={prediction.confidence > 80 ? 'text-success' : prediction.confidence > 50 ? 'text-yellow-400' : 'text-danger'}>
                    {prediction.confidence.toFixed(0)}%
                  </span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-1.5">
                  <div 
                    className={`h-1.5 rounded-full ${prediction.confidence > 80 ? 'bg-success' : prediction.confidence > 50 ? 'bg-yellow-400' : 'bg-danger'}`}
                    style={{ width: `${prediction.confidence}%` }}
                  />
                </div>
                <div className="text-[10px] text-gray-500 mt-2 pt-2 border-t border-gray-700">
                  Range: ${prediction.range.min.toFixed(selectedSymbol.includes('JPY') ? 2 : 4)} - ${prediction.range.max.toFixed(selectedSymbol.includes('JPY') ? 2 : 4)}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="neon-card p-3 flex items-center justify-center">
            <div className="text-center text-gray-500">
              <div className="text-2xl mb-1">🔮</div>
              <div className="text-xs">Sem previsão</div>
              <div className="text-[10px] mt-1">Clique no botão</div>
            </div>
          </div>
        )}
        
        <OrderBook symbol={selectedSymbol} />
      </div>
      
      {error && (
        <div className="bg-danger/20 border border-danger rounded p-2 text-danger">
          <div className="flex items-center gap-2">
            <span className="text-lg">❌</span>
            <div>
              <div className="text-xs font-bold">Erro:</div>
              <div className="text-[10px]">{error.message}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
