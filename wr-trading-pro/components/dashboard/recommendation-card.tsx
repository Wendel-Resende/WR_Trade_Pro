'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CyberBadge } from '@/components/ui/cyber-badge';
import { Recommendation } from '@/lib/analysis/recommendations';

interface RecommendationCardProps {
  recommendation: Recommendation;
  className?: string;
}

export function RecommendationCard({ recommendation, className = '' }: RecommendationCardProps) {
  const {
    symbol,
    signal,
    strength,
    confidence,
    reasons,
    indicators,
    targetPrice,
    stopLoss,
    timestamp
  } = recommendation;

  // Determinar cores baseadas no sinal
  const signalColors = {
    BUY: {
      bg: 'bg-gradient-to-r from-green-900/20 to-emerald-900/10',
      border: 'border-green-500/30',
      text: 'text-green-400',
      badge: 'bg-green-500/20 text-green-400 border-green-500/30'
    },
    SELL: {
      bg: 'bg-gradient-to-r from-red-900/20 to-rose-900/10',
      border: 'border-red-500/30',
      text: 'text-red-400',
      badge: 'bg-red-500/20 text-red-400 border-red-500/30'
    },
    HOLD: {
      bg: 'bg-gradient-to-r from-yellow-900/20 to-amber-900/10',
      border: 'border-yellow-500/30',
      text: 'text-yellow-400',
      badge: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
    }
  };

  const colors = signalColors[signal];

  // Formatar data
  const formattedDate = new Date(timestamp).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  // Função para obter ícone do indicador
  const getIndicatorIcon = (signal: string) => {
    switch (signal) {
      case 'BUY': return '↗';
      case 'SELL': return '↘';
      default: return '➡';
    }
  };

  // Função para obter cor do indicador
  const getIndicatorColor = (signal: string) => {
    switch (signal) {
      case 'BUY': return 'text-green-400';
      case 'SELL': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  return (
    <Card className={`${colors.bg} ${colors.border} border-2 backdrop-blur-sm ${className}`}>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className={`${colors.text} text-2xl font-bold`}>
              {symbol}
            </CardTitle>
            <CardDescription className="text-gray-400">
              Análise técnica • {formattedDate}
            </CardDescription>
          </div>
          <CyberBadge className={`${colors.badge} text-lg font-bold px-4 py-1`}>
            {signal}
          </CyberBadge>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Score e Confiança */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="flex justify-between mb-1">
              <span className="text-sm text-gray-400">Força do Sinal</span>
              <span className="text-sm font-bold">{strength}%</span>
            </div>
            <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-green-500 to-emerald-400"
                style={{ width: `${strength}%` }}
              />
            </div>
          </div>
          <div>
            <div className="flex justify-between mb-1">
              <span className="text-sm text-gray-400">Confiança</span>
              <span className="text-sm font-bold">{confidence}%</span>
            </div>
            <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-blue-500 to-cyan-400"
                style={{ width: `${confidence}%` }}
              />
            </div>
          </div>
        </div>

        {/* Indicadores Técnicos */}
        <div>
          <h4 className="text-sm font-semibold text-gray-400 mb-3">INDICADORES TÉCNICOS</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-black/30 rounded-lg p-3 border border-gray-800">
              <div className="text-xs text-gray-500 mb-1">RSI</div>
              <div className="flex items-center justify-between">
                <span className="font-bold">{indicators.rsi.value.toFixed(1)}</span>
                <span className={`text-lg ${getIndicatorColor(indicators.rsi.signal)}`}>
                  {getIndicatorIcon(indicators.rsi.signal)}
                </span>
              </div>
              <div className="text-xs text-gray-400 mt-1">{indicators.rsi.signal}</div>
            </div>

            <div className="bg-black/30 rounded-lg p-3 border border-gray-800">
              <div className="text-xs text-gray-500 mb-1">MACD</div>
              <div className="flex items-center justify-between">
                <span className="font-bold">{indicators.macd.value.toFixed(3)}</span>
                <span className={`text-lg ${getIndicatorColor(indicators.macd.signal)}`}>
                  {getIndicatorIcon(indicators.macd.signal)}
                </span>
              </div>
              <div className="text-xs text-gray-400 mt-1">{indicators.macd.signal}</div>
            </div>

            <div className="bg-black/30 rounded-lg p-3 border border-gray-800">
              <div className="text-xs text-gray-500 mb-1">BOLLINGER</div>
              <div className="flex items-center justify-between">
                <span className="font-bold">{indicators.bollinger.value.toFixed(1)}%</span>
                <span className={`text-lg ${getIndicatorColor(indicators.bollinger.signal)}`}>
                  {getIndicatorIcon(indicators.bollinger.signal)}
                </span>
              </div>
              <div className="text-xs text-gray-400 mt-1">{indicators.bollinger.signal}</div>
            </div>

            <div className="bg-black/30 rounded-lg p-3 border border-gray-800">
              <div className="text-xs text-gray-500 mb-1">TENDÊNCIA</div>
              <div className="flex items-center justify-between">
                <span className="font-bold">{indicators.trend.value}</span>
                <span className={`text-lg ${getIndicatorColor(indicators.trend.signal)}`}>
                  {getIndicatorIcon(indicators.trend.signal)}
                </span>
              </div>
              <div className="text-xs text-gray-400 mt-1">{indicators.trend.signal}</div>
            </div>
          </div>
        </div>

        {/* Razões da Recomendação */}
        {reasons.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold text-gray-400 mb-3">RAZÕES DA RECOMENDAÇÃO</h4>
            <ul className="space-y-2">
              {reasons.map((reason, index) => (
                <li key={index} className="flex items-start">
                  <div className={`w-2 h-2 rounded-full mt-2 mr-3 ${colors.text} bg-current`} />
                  <span className="text-sm text-gray-300">{reason}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Target Price e Stop Loss */}
        {(targetPrice || stopLoss) && (
          <div className="grid grid-cols-2 gap-4">
            {targetPrice && (
              <div className="bg-black/30 rounded-lg p-4 border border-gray-800">
                <div className="text-xs text-gray-500 mb-1">TARGET PRICE</div>
                <div className="text-xl font-bold text-green-400">
                  ${targetPrice.toFixed(2)}
                </div>
                <div className="text-xs text-gray-400 mt-1">Preço alvo estimado</div>
              </div>
            )}
            {stopLoss && (
              <div className="bg-black/30 rounded-lg p-4 border border-gray-800">
                <div className="text-xs text-gray-500 mb-1">STOP LOSS</div>
                <div className="text-xl font-bold text-red-400">
                  ${stopLoss.toFixed(2)}
                </div>
                <div className="text-xs text-gray-400 mt-1">Proteção de risco</div>
              </div>
            )}
          </div>
        )}

        {/* Resumo da Análise */}
        <div className="pt-4 border-t border-gray-800">
          <div className="text-sm text-gray-400">
            <span className="font-semibold">Resumo:</span> Baseado na análise de 4 indicadores técnicos, 
            o sistema recomenda <span className={`font-bold ${colors.text}`}>{signal}</span> para {symbol} 
            com força de <span className="font-bold">{strength}%</span> e confiança de <span className="font-bold">{confidence}%</span>.
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Componente para múltiplas recomendações
interface RecommendationGridProps {
  recommendations: Recommendation[];
  title?: string;
}

export function RecommendationGrid({ recommendations, title = 'Recomendações' }: RecommendationGridProps) {
  if (recommendations.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-500 text-lg">Nenhuma recomendação disponível</div>
        <div className="text-gray-600 text-sm mt-2">Aguardando dados de mercado para análise</div>
      </div>
    );
  }

  // Separar por sinal
  const buyRecommendations = recommendations.filter(r => r.signal === 'BUY');
  const sellRecommendations = recommendations.filter(r => r.signal === 'SELL');
  const holdRecommendations = recommendations.filter(r => r.signal === 'HOLD');

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-white">{title}</h2>
        <div className="flex gap-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
            <span className="text-sm text-gray-400">BUY ({buyRecommendations.length})</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
            <span className="text-sm text-gray-400">SELL ({sellRecommendations.length})</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
            <span className="text-sm text-gray-400">HOLD ({holdRecommendations.length})</span>
          </div>
        </div>
      </div>

      {/* Recomendações BUY */}
      {buyRecommendations.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-green-400 mb-4">RECOMENDAÇÕES DE COMPRA</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {buyRecommendations.map((rec, index) => (
              <RecommendationCard key={`buy-${index}`} recommendation={rec} />
            ))}
          </div>
        </div>
      )}

      {/* Recomendações SELL */}
      {sellRecommendations.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-red-400 mb-4">RECOMENDAÇÕES DE VENDA</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sellRecommendations.map((rec, index) => (
              <RecommendationCard key={`sell-${index}`} recommendation={rec} />
            ))}
          </div>
        </div>
      )}

      {/* Recomendações HOLD */}
      {holdRecommendations.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-yellow-400 mb-4">MANTER POSIÇÃO</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {holdRecommendations.map((rec, index) => (
              <RecommendationCard key={`hold-${index}`} recommendation={rec} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default RecommendationCard;
