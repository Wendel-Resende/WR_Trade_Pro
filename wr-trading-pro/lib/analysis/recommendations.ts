/**
 * Sistema de recomendações de trading
 * 
 * Analisa dados de mercado e gera recomendações baseadas em indicadores técnicos
 */

import {
  calculateSMA,
  calculateRSI,
  calculateMACD,
  calculateBollingerBands,
  calculateAllIndicators,
  IndicatorUtils
} from '../indicators';

/**
 * Dados de mercado necessários para análise
 */
export interface MarketData {
  symbol: string;
  prices: number[];
  high?: number[];
  low?: number[];
  close?: number[];
  currentPrice: number;
  volume?: number[];
  timestamp?: Date;
}

/**
 * Sinal de um indicador individual
 */
export interface IndicatorSignal {
  value: number;
  signal: 'BUY' | 'SELL' | 'NEUTRAL';
  strength: number; // 0-100
}

/**
 * Recomendação completa gerada pela análise
 */
export interface Recommendation {
  symbol: string;
  strength: number; // 0-100
  confidence: number; // 0-100
  signal: 'BUY' | 'SELL' | 'HOLD';
  reasons: string[];
  indicators: {
    rsi: { value: number; signal: string };
    macd: { value: number; signal: string };
    bollinger: { value: number; signal: string };
    trend: { value: string; signal: string };
  };
  targetPrice?: number;
  stopLoss?: number;
  timestamp: Date;
  score: number; // Pontuação total da análise
}

/**
 * Configurações do sistema de recomendações
 */
export interface RecommendationConfig {
  rsiOversold: number;
  rsiOverbought: number;
  bollingerStdDev: number;
  smaShortPeriod: number;
  smaMediumPeriod: number;
  macdSignalPeriod: number;
}

/**
 * Configurações padrão
 */
export const DEFAULT_CONFIG: RecommendationConfig = {
  rsiOversold: 30,
  rsiOverbought: 70,
  bollingerStdDev: 2,
  smaShortPeriod: 20,
  smaMediumPeriod: 50,
  macdSignalPeriod: 9
};

/**
 * Analisa um ativo e gera uma recomendação de trading
 * 
 * @param data Dados de mercado do ativo
 * @param config Configurações opcionais do sistema
 * @returns Recomendação completa
 */
export function analyzeAsset(
  data: MarketData,
  config: RecommendationConfig = DEFAULT_CONFIG
): Recommendation {
  const { prices, currentPrice, symbol } = data;
  
  // Validar dados
  if (prices.length < 50) {
    throw new Error(`Dados insuficientes para análise. Necessário mínimo 50 preços, recebido: ${prices.length}`);
  }
  
  // Calcular todos os indicadores
  const allIndicators = calculateAllIndicators(prices);
  
  // Obter últimos valores válidos
  const lastRSI = getLastValidValue(allIndicators.rsi);
  const lastMACD = getLastValidValue(allIndicators.macd.macd);
  const lastMACDSignal = getLastValidValue(allIndicators.macd.signal);
  const lastBollingerMiddle = getLastValidValue(allIndicators.bollinger.middle);
  const lastBollingerUpper = getLastValidValue(allIndicators.bollinger.upper);
  const lastBollingerLower = getLastValidValue(allIndicators.bollinger.lower);
  
  // Calcular médias móveis para tendência
  const smaShort = calculateSMA(prices, config.smaShortPeriod);
  const smaMedium = calculateSMA(prices, config.smaMediumPeriod);
  const lastSMAShort = getLastValidValue(smaShort);
  const lastSMAMedium = getLastValidValue(smaMedium);
  
  // Inicializar pontuação e razões
  let score = 0;
  const reasons: string[] = [];
  const indicatorSignals = {
    rsi: { value: 0, signal: 'NEUTRAL' as 'BUY' | 'SELL' | 'NEUTRAL' },
    macd: { value: 0, signal: 'NEUTRAL' as 'BUY' | 'SELL' | 'NEUTRAL' },
    bollinger: { value: 0, signal: 'NEUTRAL' as 'BUY' | 'SELL' | 'NEUTRAL' },
    trend: { value: '', signal: 'NEUTRAL' as 'BUY' | 'SELL' | 'NEUTRAL' }
  };
  
  // 1. Análise RSI
  if (lastRSI !== null) {
    indicatorSignals.rsi.value = lastRSI;
    
    if (lastRSI < config.rsiOversold) {
      score += 20;
      reasons.push(`RSI oversold (${lastRSI.toFixed(1)} < ${config.rsiOversold})`);
      indicatorSignals.rsi.signal = 'BUY';
    } else if (lastRSI > config.rsiOverbought) {
      score -= 20;
      reasons.push(`RSI overbought (${lastRSI.toFixed(1)} > ${config.rsiOverbought})`);
      indicatorSignals.rsi.signal = 'SELL';
    } else {
      reasons.push(`RSI neutro (${lastRSI.toFixed(1)})`);
      indicatorSignals.rsi.signal = 'NEUTRAL';
    }
  }
  
  // 2. Análise MACD
  if (lastMACD !== null && lastMACDSignal !== null) {
    const macdValue = lastMACD - lastMACDSignal;
    indicatorSignals.macd.value = macdValue;
    
    if (macdValue > 0) {
      score += 15;
      reasons.push('MACD acima da linha de sinal (cruzamento positivo)');
      indicatorSignals.macd.signal = 'BUY';
    } else {
      score -= 15;
      reasons.push('MACD abaixo da linha de sinal');
      indicatorSignals.macd.signal = 'SELL';
    }
  }
  
  // 3. Análise Bollinger Bands
  if (lastBollingerLower !== null && currentPrice !== undefined) {
    const bollingerPosition = (currentPrice - lastBollingerLower) / (lastBollingerUpper! - lastBollingerLower);
    indicatorSignals.bollinger.value = bollingerPosition * 100;
    
    if (currentPrice < lastBollingerLower) {
      score += 15;
      reasons.push(`Preço abaixo da banda inferior de Bollinger (${currentPrice.toFixed(2)} < ${lastBollingerLower.toFixed(2)})`);
      indicatorSignals.bollinger.signal = 'BUY';
    } else if (currentPrice > lastBollingerUpper!) {
      score -= 15;
      reasons.push(`Preço acima da banda superior de Bollinger (${currentPrice.toFixed(2)} > ${lastBollingerUpper!.toFixed(2)})`);
      indicatorSignals.bollinger.signal = 'SELL';
    } else {
      reasons.push(`Preço dentro das bandas de Bollinger (${bollingerPosition.toFixed(2)})`);
      indicatorSignals.bollinger.signal = 'NEUTRAL';
    }
  }
  
  // 4. Análise de tendência (SMA)
  if (lastSMAShort !== null && lastSMAMedium !== null) {
    const trendUp = lastSMAShort > lastSMAMedium;
    indicatorSignals.trend.value = trendUp ? 'ALTA' : 'BAIXA';
    
    if (trendUp) {
      score += 10;
      reasons.push(`Tendência de alta (SMA${config.smaShortPeriod} > SMA${config.smaMediumPeriod})`);
      indicatorSignals.trend.signal = 'BUY';
    } else {
      score -= 10;
      reasons.push(`Tendência de baixa (SMA${config.smaShortPeriod} < SMA${config.smaMediumPeriod})`);
      indicatorSignals.trend.signal = 'SELL';
    }
  }
  
  // Determinar sinal final baseado na pontuação
  let signal: 'BUY' | 'SELL' | 'HOLD' = 'HOLD';
  if (score >= 40) {
    signal = 'BUY';
  } else if (score <= -40) {
    signal = 'SELL';
  }
  
  // Calcular confiança baseada na concordância dos indicadores
  const buySignals = [
    indicatorSignals.rsi.signal,
    indicatorSignals.macd.signal,
    indicatorSignals.bollinger.signal,
    indicatorSignals.trend.signal
  ].filter(s => s === 'BUY').length;
  
  const sellSignals = [
    indicatorSignals.rsi.signal,
    indicatorSignals.macd.signal,
    indicatorSignals.bollinger.signal,
    indicatorSignals.trend.signal
  ].filter(s => s === 'SELL').length;
  
  const totalSignals = 4;
  const agreement = Math.max(buySignals, sellSignals) / totalSignals;
  const confidence = Math.min(100, Math.round(agreement * 100));
  
  // Calcular força (normalizar score para 0-100)
  const maxPossibleScore = 20 + 15 + 15 + 10; // 60
  const strength = Math.min(100, Math.max(0, Math.round((score + maxPossibleScore) / (2 * maxPossibleScore) * 100)));
  
  // Calcular target price e stop loss (se for recomendação de compra/venda)
  let targetPrice: number | undefined;
  let stopLoss: number | undefined;
  
  if (signal === 'BUY' && lastBollingerUpper !== null) {
    targetPrice = lastBollingerUpper * 0.98; // 2% abaixo da banda superior
    stopLoss = lastBollingerLower! * 1.02; // 2% acima da banda inferior
  } else if (signal === 'SELL' && lastBollingerLower !== null) {
    targetPrice = lastBollingerLower * 1.02; // 2% acima da banda inferior
    stopLoss = lastBollingerUpper! * 0.98; // 2% abaixo da banda superior
  }
  
  return {
    symbol,
    strength,
    confidence,
    signal,
    reasons,
    indicators: {
      rsi: {
        value: indicatorSignals.rsi.value,
        signal: indicatorSignals.rsi.signal
      },
      macd: {
        value: indicatorSignals.macd.value,
        signal: indicatorSignals.macd.signal
      },
      bollinger: {
        value: indicatorSignals.bollinger.value,
        signal: indicatorSignals.bollinger.signal
      },
      trend: {
        value: indicatorSignals.trend.value,
        signal: indicatorSignals.trend.signal
      }
    },
    targetPrice,
    stopLoss,
    timestamp: new Date(),
    score
  };
}

/**
 * Obtém o último valor não nulo de um array
 */
function getLastValidValue<T>(array: (T | null)[]): T | null {
  for (let i = array.length - 1; i >= 0; i--) {
    if (array[i] !== null) {
      return array[i];
    }
  }
  return null;
}

/**
 * Analisa múltiplos ativos e retorna recomendações ordenadas
 */
export function analyzeMultipleAssets(
  assets: MarketData[],
  config: RecommendationConfig = DEFAULT_CONFIG
): Recommendation[] {
  const recommendations = assets.map(asset => analyzeAsset(asset, config));
  
  // Ordenar por força (mais forte primeiro)
  return recommendations.sort((a, b) => b.strength - a.strength);
}

/**
 * Filtra recomendações por sinal
 */
export function filterRecommendations(
  recommendations: Recommendation[],
  signal: 'BUY' | 'SELL' | 'HOLD'
): Recommendation[] {
  return recommendations.filter(rec => rec.signal === signal);
}

/**
 * Exporta recomendações para formato CSV
 */
export function exportToCSV(recommendations: Recommendation[]): string {
  const headers = [
    'Symbol',
    'Signal',
    'Strength',
    'Confidence',
    'Score',
    'Target Price',
    'Stop Loss',
    'Timestamp',
    'Reasons'
  ];
  
  const rows = recommendations.map(rec => [
    rec.symbol,
    rec.signal,
    rec.strength.toString(),
    rec.confidence.toString(),
    rec.score.toString(),
    rec.targetPrice?.toFixed(2) || '',
    rec.stopLoss?.toFixed(2) || '',
    rec.timestamp.toISOString(),
    rec.reasons.join('; ')
  ]);
  
  return [headers, ...rows].map(row => row.join(',')).join('\n');
}

export default {
  analyzeAsset,
  analyzeMultipleAssets,
  filterRecommendations,
  exportToCSV,
  DEFAULT_CONFIG
};
