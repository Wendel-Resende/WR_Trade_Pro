'use client';

import { useEffect } from 'react';
import { usePricePrediction, PredictionTimeframe } from '@/hooks/usePricePrediction';
import { useMarketData } from '@/hooks/useMarketData';

interface PredictionCardProps {
  selectedSymbol?: string;
  candles?: any[];
}

export default function PredictionCard({ selectedSymbol: propSymbol, candles: propCandles }: PredictionCardProps = {}) {
  // Usar props se fornecidos, senão usar padrão
  const selectedSymbol = propSymbol || 'EURUSD';
  
  // Se candles foi passado, usar diretamente, senão buscar via useMarketData
  const { data: marketData } = useMarketData(selectedSymbol);
  const candles = propCandles || marketData?.candles || [];
  const currentPrice = marketData?.bid || 0;

  // Log para debug (apenas em desenvolvimento)
  if (process.env.NODE_ENV === 'development') {
    // Log mínimo para debug
  }
  
  const {
    prediction,
    isTraining,
    isLoading,
    error,
    lastTrainedAt,
    selectedTimeframe,
    isModelReady,
    setSelectedTimeframe,
    trainAndPredict,
    trainModel,
    predict,
    getTimeframeLabel,
  } = usePricePrediction(selectedSymbol, candles);

  const formatPrice = (price: number) => {
    return price.toFixed(5);
  };

  const formatConfidence = (conf: number) => {
    return conf.toFixed(1);
  };

  const getPredictionArrow = () => {
    if (!prediction || !currentPrice) return '➡️';
    if (prediction.price > currentPrice) return '📈';
    if (prediction.price < currentPrice) return '📉';
    return '➡️';
  };

  const getPredictionColor = () => {
    if (!prediction || !currentPrice) return 'text-gray-400';
    if (prediction.price > currentPrice) return 'text-green-500';
    if (prediction.price < currentPrice) return 'text-red-500';
    return 'text-gray-400';
  };

  // Efeito: quando mudar o timeframe, fazer nova previsão automaticamente
  useEffect(() => {
    const handleTimeframeChange = async () => {
      if (isModelReady && !isTraining && !isLoading) {
        await trainAndPredict(selectedTimeframe);
      }
    };
    
    handleTimeframeChange();
  }, [selectedTimeframe]);

  const handlePredict = async () => {
    await trainAndPredict(selectedTimeframe);
  };

  const handleTrainOnly = async () => {
    await trainModel();
  };

  return (
    <div className="bg-surface border border-gray-800 rounded-xl p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-white flex items-center gap-2">
          <span>🎯</span> Previsão ML
        </h3>
        <div className={`px-3 py-1 text-xs font-semibold rounded-full ${
          isLoading || isTraining 
            ? 'bg-yellow-500/20 text-yellow-500' 
            : error 
              ? 'bg-danger/20 text-danger'
              : prediction 
                ? 'bg-green-500/20 text-green-500'
                : 'bg-gray-700 text-gray-400'
        }`}>
          {isLoading ? 'Calculando...' : isTraining ? 'Treinando...' : error ? 'Erro' : prediction ? 'Ativo' : 'Aguardando'}
        </div>
      </div>

      <div className="space-y-6">
        {/* Selector de Timeframe */}
        {isModelReady && !isTraining && (
          <div>
            <label className="text-sm text-muted mb-2 block">Timeframe da Previsão</label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {(Object.keys({ hourly: '', daily: '', weekly: '', yearly: '' }) as PredictionTimeframe[]).map((tf) => (
                <button
                  key={tf}
                  onClick={() => setSelectedTimeframe(tf)}
                  className={`px-3 py-2 text-xs font-semibold rounded-lg transition-all ${
                    selectedTimeframe === tf
                      ? 'bg-primary/20 text-primary border border-primary'
                      : 'bg-surface/50 text-gray-400 hover:bg-surface'
                  }`}
                >
                  {getTimeframeLabel(tf)}
                </button>
              ))}
            </div>
          </div>
        )}

        {error ? (
          <div className="text-center py-4">
            <div className="text-red-500 text-sm mb-2">Erro ao carregar previsão</div>
            <div className="text-xs text-gray-500">{error.message}</div>
          </div>
        ) : isTraining ? (
          <div className="text-center py-4">
            <div className="text-yellow-500 text-lg mb-2">🔄</div>
            <div className="text-sm font-semibold">Treinando modelo...</div>
            <div className="text-xs text-gray-500 mt-1">Isso pode levar alguns segundos</div>
          </div>
        ) : isLoading ? (
          <div className="text-center py-4">
            <div className="text-primary text-lg mb-2">🔮</div>
            <div className="text-sm font-semibold">Calculando previsão...</div>
          </div>
        ) : !prediction ? (
          <div className="text-center py-8">
            <div className="text-5xl mb-4">🤖</div>
            <div className="text-lg font-semibold text-muted mb-2">
              {!isModelReady ? 'Modelo não treinado' : 'Nenhuma previsão feita'}
            </div>
            <p className="text-sm text-gray-500 mb-4">
              {!isModelReady 
                ? 'Clique no botão abaixo para treinar o modelo'
                : 'Clique no botão abaixo para fazer uma previsão'}
            </p>
            
            {/* Botões separados */}
            <div className="flex flex-col gap-2">
              {!isModelReady && (
                <button
                  onClick={handleTrainOnly}
                  disabled={isLoading || isTraining || candles.length < 60}
                  className={`px-6 py-3 rounded-lg font-semibold transition-all ${
                    candles.length < 60
                      ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                      : 'bg-gradient-to-r from-primary to-secondary text-white hover:opacity-90'
                  }`}
                >
                  🧠 Treinar Modelo
                </button>
              )}
              
              {isModelReady && (
                <button
                  onClick={handlePredict}
                  disabled={isLoading || isTraining}
                  className={`px-6 py-3 rounded-lg font-semibold transition-all ${
                    isLoading || isTraining
                      ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                      : 'bg-gradient-to-r from-primary to-secondary text-white hover:opacity-90'
                  }`}
                >
                  🔮 Fazer Previsão
                </button>
              )}
            </div>
            
            {/* Progresso de dados */}
            {candles.length > 0 && candles.length < 60 && (
              <div className="mt-4">
                <div className="text-sm text-muted mb-1">
                  Candles coletados: {candles.length}/60
                </div>
                <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-primary to-secondary transition-all" 
                    style={{ width: `${Math.min((candles.length / 60) * 100, 100)}%` }}
                  ></div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <>
            <div className="text-center py-4">
              <div className="text-4xl mb-2">{getPredictionArrow()}</div>
              <div className={`text-3xl font-bold ${getPredictionColor()}`}>
                {formatPrice(prediction.price)}
              </div>
              <div className="text-sm text-muted mt-2">
                Preço atual: {formatPrice(currentPrice)}
              </div>
              <div className="text-sm text-gray-400 mt-1">
                {prediction.price > currentPrice ? (
                  <span className="text-green-500">+{formatPrice(prediction.price - currentPrice)}</span>
                ) : prediction.price < currentPrice ? (
                  <span className="text-red-500">{formatPrice(prediction.price - currentPrice)}</span>
                ) : (
                  <span>0.00000</span>
                )}
              </div>
              <div className="text-xs text-primary mt-2 font-semibold">
                Previsão para {getTimeframeLabel(selectedTimeframe)}
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted">Confiança</span>
                <span className="text-sm font-semibold">
                  {formatConfidence(prediction.confidence)}%
                </span>
              </div>
              <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden">
                <div 
                  className={`h-full transition-all ${
                    prediction.confidence > 80 
                      ? 'bg-gradient-to-r from-green-500 to-green-400'
                      : prediction.confidence > 50
                        ? 'bg-gradient-to-r from-yellow-500 to-yellow-400'
                        : 'bg-gradient-to-r from-red-500 to-red-400'
                  }`}
                  style={{ width: `${prediction.confidence}%` }}
                ></div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-4 border-t border-gray-800">
              <div className="text-center p-3 bg-surface/50 rounded-lg">
                <div className="text-xs text-muted mb-1">Range Mín</div>
                <div className="text-sm font-semibold text-red-400">
                  {formatPrice(prediction.range.min)}
                </div>
              </div>
              <div className="text-center p-3 bg-surface/50 rounded-lg">
                <div className="text-xs text-muted mb-1">Range Máx</div>
                <div className="text-sm font-semibold text-green-400">
                  {formatPrice(prediction.range.max)}
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-gray-800">
              <button
                onClick={handlePredict}
                disabled={isLoading || isTraining}
                className={`w-full px-4 py-3 rounded-lg font-semibold transition-all ${
                  isLoading || isTraining
                    ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                    : 'bg-gradient-to-r from-pink-500 to-purple-500 text-white hover:opacity-90'
                }`}
              >
                {isLoading ? '🔄 Atualizando...' : '🔮 Nova Previsão'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
