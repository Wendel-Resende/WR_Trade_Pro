/**
 * Exportação de indicadores técnicos
 * 
 * @module lib/indicators
 */

import technicalIndicators from './technical';

export * from './technical';

/**
 * Tipos de indicadores disponíveis
 */
export type {
  // Tipos serão inferidos automaticamente das funções exportadas
} from './technical';

/**
 * Utilitários para análise técnica
 */
export const IndicatorUtils = {
  /**
   * Normaliza uma série de preços removendo valores null
   */
  normalizePrices: (prices: (number | null)[]): number[] => {
    return prices.filter((p): p is number => p !== null);
  },

  /**
   * Calcula retorno percentual entre dois preços
   */
  calculateReturn: (initial: number, final: number): number => {
    return ((final - initial) / initial) * 100;
  },

  /**
   * Gera sinais de compra/venda baseados em crossover de médias móveis
   */
  generateSignalFromCrossover: (
    fastMA: (number | null)[],
    slowMA: (number | null)[]
  ): ('BUY' | 'SELL' | 'HOLD' | null)[] => {
    const signals: ('BUY' | 'SELL' | 'HOLD' | null)[] = [];
    
    for (let i = 1; i < fastMA.length; i++) {
      if (fastMA[i] === null || slowMA[i] === null || 
          fastMA[i - 1] === null || slowMA[i - 1] === null) {
        signals.push(null);
        continue;
      }
      
      const fastAboveSlow = fastMA[i]! > slowMA[i]!;
      const fastWasBelowSlow = fastMA[i - 1]! <= slowMA[i - 1]!;
      
      if (fastAboveSlow && fastWasBelowSlow) {
        signals.push('BUY');
      } else if (!fastAboveSlow && !fastWasBelowSlow) {
        signals.push('SELL');
      } else {
        signals.push('HOLD');
      }
    }
    
    // Adicionar null no início para manter o mesmo tamanho
    signals.unshift(null);
    return signals;
  },

  /**
   * Detecta divergências entre preço e indicador
   */
  detectDivergence: (
    prices: number[],
    indicator: (number | null)[],
    lookback: number = 5
  ): {
    type: 'BULLISH' | 'BEARISH' | null;
    index: number;
  }[] => {
    const divergences: {
      type: 'BULLISH' | 'BEARISH' | null;
      index: number;
    }[] = [];
    
    for (let i = lookback; i < prices.length; i++) {
      if (indicator[i] === null || indicator[i - lookback] === null) {
        divergences.push({ type: null, index: i });
        continue;
      }
      
      const priceHigher = prices[i] > prices[i - lookback];
      const indicatorLower = indicator[i]! < indicator[i - lookback]!;
      
      const priceLower = prices[i] < prices[i - lookback];
      const indicatorHigher = indicator[i]! > indicator[i - lookback]!;
      
      if (priceHigher && indicatorLower) {
        divergences.push({ type: 'BEARISH', index: i });
      } else if (priceLower && indicatorHigher) {
        divergences.push({ type: 'BULLISH', index: i });
      } else {
        divergences.push({ type: null, index: i });
      }
    }
    
    // Preencher início com null
    for (let i = 0; i < lookback; i++) {
      divergences.unshift({ type: null, index: i });
    }
    
    return divergences;
  }
};

/**
 * Configurações padrão para indicadores
 */
export const DefaultIndicatorConfigs = {
  SMA: {
    short: 20,
    medium: 50,
    long: 200
  },
  EMA: {
    short: 12,
    medium: 26,
    long: 50
  },
  RSI: {
    period: 14,
    overbought: 70,
    oversold: 30
  },
  MACD: {
    fast: 12,
    slow: 26,
    signal: 9
  },
  BollingerBands: {
    period: 20,
    stdDev: 2
  },
  Stochastic: {
    period: 14,
    smoothK: 3,
    smoothD: 3
  },
  ATR: {
    period: 14
  }
};

export default {
  ...technicalIndicators,
  IndicatorUtils,
  DefaultIndicatorConfigs
};
