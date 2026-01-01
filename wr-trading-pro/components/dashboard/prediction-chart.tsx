'use client';

import { useEffect, useRef, useState } from 'react';
import type { Prediction } from '@/lib/ml/types';
import type { Candle } from '@/lib/ml/types';

declare global {
  interface Window {
    LightweightCharts: any;
  }
}

interface PredictionChartProps {
  symbol: string;
  historicalData: Candle[];
  prediction?: Prediction;
  onRetrain?: () => void;
}

export default function PredictionChart({
  symbol,
  historicalData,
  prediction,
  onRetrain
}: PredictionChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<any>(null);
  const candlestickSeriesRef = useRef<any>(null);
  const predictionSeriesRef = useRef<any>(null);
  const [isChartReady, setIsChartReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLibraryLoaded, setIsLibraryLoaded] = useState(false);

  // Carregar biblioteca lightweight-charts
  useEffect(() => {
    if (typeof window !== 'undefined' && !window.LightweightCharts) {
      const script = document.createElement('script');
      script.src = 'https://unpkg.com/lightweight-charts@4.1.3/dist/lightweight-charts.standalone.production.js';
      script.async = true;
      script.onload = () => {
        console.log('✅ Lightweight Charts loaded');
        setIsLibraryLoaded(true);
      };
      script.onerror = () => {
        console.error('❌ Failed to load Lightweight Charts');
        setError('Falha ao carregar biblioteca de gráficos');
      };
      document.head.appendChild(script);
    } else if (window.LightweightCharts) {
      setIsLibraryLoaded(true);
    }
  }, []);

  // Criar gráfico
  useEffect(() => {
    if (!isLibraryLoaded || !chartContainerRef.current) {
      return;
    }

    console.log('📊 Criando gráfico de candles...');

    // Limpar gráfico existente
    if (chartRef.current) {
      chartRef.current.remove();
      chartRef.current = null;
    }

    try {
      const LightweightCharts = window.LightweightCharts;

      // Criar gráfico
      const chart = LightweightCharts.createChart(chartContainerRef.current, {
        width: chartContainerRef.current.clientWidth,
        height: 300,
        layout: {
          background: { color: '#0A0E27' },
          textColor: '#00F5FF',
        },
        grid: {
          vertLines: { color: '#1A1F3A' },
          horzLines: { color: '#1A1F3A' },
        },
        timeScale: {
          borderColor: '#1A1F3A',
          timeVisible: true,
          secondsVisible: false,
        },
        rightPriceScale: {
          borderColor: '#1A1F3A',
        },
        crosshair: {
          mode: LightweightCharts.CrosshairMode.Normal,
        },
      });

      chartRef.current = chart;

      // Adicionar série de CANDLES (não linha!)
      const candlestickSeries = chart.addCandlestickSeries({
        upColor: '#26a69a', // Verde para candles de alta
        downColor: '#ef5350', // Vermelho para candles de baixa
        borderVisible: false,
        wickUpColor: '#26a69a',
        wickDownColor: '#ef5350',
      });

      candlestickSeriesRef.current = candlestickSeries;
      console.log('✅ Candlestick series created');

      // Adicionar linha de previsão
      const predictionSeries = chart.addLineSeries({
        color: '#FF006E',
        lineWidth: 2,
        lineStyle: 2, // Pontilhado
        priceLineVisible: false,
        lastValueVisible: true,
      });

      predictionSeriesRef.current = predictionSeries;
      console.log('✅ Prediction line series created');

      setIsChartReady(true);

      // Resize handler
      const handleResize = () => {
        if (chartContainerRef.current && chartRef.current) {
          chartRef.current.applyOptions({
            width: chartContainerRef.current.clientWidth,
          });
        }
      };

      window.addEventListener('resize', handleResize);

      return () => {
        window.removeEventListener('resize', handleResize);
        if (chartRef.current) {
          chartRef.current.remove();
          chartRef.current = null;
        }
        setIsChartReady(false);
      };
    } catch (error) {
      console.error('❌ Erro ao criar gráfico:', error);
      setError(`Erro ao criar gráfico: ${error}`);
    }
  }, [isLibraryLoaded, symbol]); // Adicionar symbol como dependência

  // Atualizar dados de candles
  useEffect(() => {
    if (!isChartReady || !candlestickSeriesRef.current) {
      return;
    }

    if (!historicalData || historicalData.length === 0) {
      console.log('⚠️ Nenhum dado disponível');
      candlestickSeriesRef.current.setData([]);
      return;
    }

    console.log(`📊 Atualizando ${historicalData.length} candles...`);

    try {
      // Converter para formato CandlestickData
      const candleData = historicalData
        .filter(candle => 
          candle && 
          typeof candle.time === 'number' &&
          typeof candle.open === 'number' &&
          typeof candle.high === 'number' &&
          typeof candle.low === 'number' &&
          typeof candle.close === 'number' &&
          isFinite(candle.open) &&
          isFinite(candle.high) &&
          isFinite(candle.low) &&
          isFinite(candle.close)
        )
        .map(candle => ({
          time: Math.floor(candle.time / 1000), // Converter para segundos
          open: candle.open,
          high: candle.high,
          low: candle.low,
          close: candle.close,
        }));

      console.log(`✅ ${candleData.length} candles válidos do MT5`);

      if (candleData.length > 0) {
        candlestickSeriesRef.current.setData(candleData);
        chartRef.current?.timeScale().fitContent();
        console.log('✅ Candles aplicados ao gráfico');
      }

      setError(null);
    } catch (error) {
      console.error('❌ Erro ao atualizar candles:', error);
      setError(`Erro ao atualizar dados: ${error}`);
    }
  }, [isChartReady, historicalData]);

  // Atualizar previsão
  useEffect(() => {
    if (!isChartReady || !predictionSeriesRef.current) {
      return;
    }

    if (!prediction || !historicalData.length) {
      predictionSeriesRef.current.setData([]);
      return;
    }

    console.log('🔮 Atualizando previsão...');

    try {
      const lastCandle = historicalData[historicalData.length - 1];
      const lastTime = Math.floor(lastCandle.time / 1000);
      const predictionTime = lastTime + 3600; // +1 hora

      const predictionData = [
        { time: lastTime, value: lastCandle.close },
        { time: predictionTime, value: prediction.price },
      ];

      predictionSeriesRef.current.setData(predictionData);
      console.log('✅ Previsão atualizada');
    } catch (error) {
      console.error('❌ Erro ao atualizar previsão:', error);
    }
  }, [isChartReady, prediction, historicalData]);

  return (
      <div className="neon-card p-3">
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-lg font-bold text-cyan-400">
            📈 {symbol}
          </h2>
          {onRetrain && (
            <button
              onClick={onRetrain}
              className="px-2 py-1 bg-pink-500/20 border border-pink-500 rounded hover:bg-pink-500/30 transition-colors text-pink-400 text-xs font-semibold"
            >
              🔮 Prever
            </button>
          )}
        </div>

        {error && (
          <div className="bg-danger/20 border border-danger rounded p-2 mb-2 text-danger text-[10px]">
            ❌ {error}
          </div>
        )}

        <div className="mb-1 text-xs text-gray-400">
          {!historicalData || historicalData.length === 0 ? (
            <div className="text-yellow-400">⏳ Aguardando dados...</div>
          ) : (
            <div className="text-success">✅ {historicalData.length} candles</div>
          )}
        </div>

        <div 
          ref={chartContainerRef} 
          className="w-full mb-2 bg-surface/30 rounded" 
          style={{ minHeight: '300px' }} 
        />

        {(!historicalData || historicalData.length === 0) && (
          <div className="text-center text-gray-500 py-10">
            <div className="text-4xl mb-2">📊</div>
            <div className="text-sm font-bold">Aguardando dados...</div>
          </div>
        )}

        {prediction && (
          <div className="grid grid-cols-3 gap-2 mt-2">
            <div className="bg-surface/50 p-2 rounded border border-pink-500/30">
              <div className="text-[10px] text-gray-400 mb-0.5">Previsão</div>
              <div className="text-lg font-bold text-pink-400">
                ${prediction.price.toFixed(symbol.includes('JPY') ? 2 : 4)}
              </div>
              <div className="text-[10px] text-gray-500">
                1h
              </div>
            </div>

            <div className="bg-surface/50 p-2 rounded border border-cyan-500/30">
              <div className="text-[10px] text-gray-400 mb-0.5">Confiança</div>
              <div className="text-lg font-bold text-cyan-400">
                {prediction.confidence.toFixed(0)}%
              </div>
              <div className="w-full bg-gray-700 rounded-full h-1 mt-1">
                <div 
                  className={`h-1 rounded-full transition-all ${
                    prediction.confidence > 80 ? 'bg-green-400' :
                    prediction.confidence > 50 ? 'bg-yellow-400' :
                    'bg-red-400'
                  }`}
                  style={{ width: `${prediction.confidence}%` }}
                />
              </div>
            </div>

            <div className="bg-surface/50 p-2 rounded border border-purple-500/30">
              <div className="text-[10px] text-gray-400 mb-0.5">Range</div>
              <div className="text-xs font-bold text-purple-400">
                ${prediction.range.min.toFixed(symbol.includes('JPY') ? 2 : 4)}
              </div>
              <div className="text-[10px] text-gray-500">-</div>
              <div className="text-xs font-bold text-purple-400">
                ${prediction.range.max.toFixed(symbol.includes('JPY') ? 2 : 4)}
              </div>
            </div>
          </div>
        )}
    </div>
  );
}
