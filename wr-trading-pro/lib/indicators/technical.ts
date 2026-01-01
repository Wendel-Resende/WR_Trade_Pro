/**
 * Technical Indicators Library
 * Implementação de indicadores técnicos para análise quantitativa
 * 
 * @module lib/indicators/technical
 */

/**
 * Validação de inputs para indicadores técnicos
 */
function validateInputs(
  prices: number[],
  period: number,
  indicatorName: string
): void {
  if (!Array.isArray(prices)) {
    throw new TypeError(`${indicatorName}: prices deve ser um array`);
  }
  
  if (prices.length === 0) {
    throw new Error(`${indicatorName}: array de preços vazio`);
  }
  
  if (typeof period !== 'number' || period <= 0) {
    throw new Error(`${indicatorName}: período inválido (${period})`);
  }
  
  if (period > prices.length) {
    throw new Error(
      `${indicatorName}: período (${period}) maior que tamanho do array (${prices.length})`
    );
  }
  
  // Verificar se todos os valores são números finitos
  for (let i = 0; i < prices.length; i++) {
    if (typeof prices[i] !== 'number' || !Number.isFinite(prices[i])) {
      throw new Error(`${indicatorName}: preço inválido na posição ${i}: ${prices[i]}`);
    }
  }
}

/**
 * Simple Moving Average (SMA)
 * 
 * @param prices - Array de preços (geralmente preços de fechamento)
 * @param period - Período da média móvel
 * @returns Array com valores SMA (null para períodos insuficientes)
 * 
 * @example
 * ```typescript
 * const prices = [100, 102, 101, 103, 105, 104, 106];
 * const sma = calculateSMA(prices, 3);
 * // [null, null, 101, 102, 103, 104, 105]
 * ```
 */
export function calculateSMA(prices: number[], period: number): (number | null)[] {
  validateInputs(prices, period, 'SMA');
  
  const result: (number | null)[] = [];
  
  for (let i = 0; i < prices.length; i++) {
    if (i < period - 1) {
      // Períodos iniciais não têm SMA suficiente
      result.push(null);
    } else {
      // Calcular média dos últimos 'period' preços
      let sum = 0;
      for (let j = i - period + 1; j <= i; j++) {
        sum += prices[j];
      }
      result.push(sum / period);
    }
  }
  
  return result;
}

/**
 * Exponential Moving Average (EMA)
 * 
 * @param prices - Array de preços
 * @param period - Período da EMA
 * @returns Array com valores EMA (null para períodos insuficientes)
 */
export function calculateEMA(prices: number[], period: number): (number | null)[] {
  validateInputs(prices, period, 'EMA');
  
  const result: (number | null)[] = [];
  const multiplier = 2 / (period + 1);
  
  // Primeiro valor EMA é o SMA do primeiro período
  let ema: number | null = null;
  
  for (let i = 0; i < prices.length; i++) {
    if (i < period - 1) {
      result.push(null);
    } else if (i === period - 1) {
      // Calcular SMA como primeiro valor EMA
      let sum = 0;
      for (let j = 0; j < period; j++) {
        sum += prices[j];
      }
      ema = sum / period;
      result.push(ema);
    } else {
      // Calcular EMA subsequente
      ema = (prices[i] - ema!) * multiplier + ema!;
      result.push(ema);
    }
  }
  
  return result;
}

/**
 * Relative Strength Index (RSI)
 * 
 * @param prices - Array de preços
 * @param period - Período do RSI (padrão: 14)
 * @returns Array com valores RSI 0-100 (null para períodos insuficientes)
 */
export function calculateRSI(prices: number[], period: number = 14): (number | null)[] {
  validateInputs(prices, period, 'RSI');
  
  const result: (number | null)[] = [];
  const gains: number[] = [];
  const losses: number[] = [];
  
  // Calcular ganhos e perdas
  for (let i = 1; i < prices.length; i++) {
    const change = prices[i] - prices[i - 1];
    gains.push(change > 0 ? change : 0);
    losses.push(change < 0 ? Math.abs(change) : 0);
  }
  
  // Calcular RSI
  for (let i = 0; i < prices.length; i++) {
    if (i < period) {
      result.push(null);
    } else {
      // Calcular médias de ganhos e perdas
      let avgGain = 0;
      let avgLoss = 0;
      
      for (let j = i - period; j < i; j++) {
        avgGain += gains[j];
        avgLoss += losses[j];
      }
      
      avgGain /= period;
      avgLoss /= period;
      
      if (avgLoss === 0) {
        result.push(100);
      } else {
        const rs = avgGain / avgLoss;
        const rsi = 100 - (100 / (1 + rs));
        result.push(rsi);
      }
    }
  }
  
  return result;
}

/**
 * Moving Average Convergence Divergence (MACD)
 * 
 * @param prices - Array de preços
 * @returns Objeto com MACD, signal line e histograma
 */
export function calculateMACD(prices: number[]): {
  macd: (number | null)[];
  signal: (number | null)[];
  histogram: (number | null)[];
} {
  validateInputs(prices, 26, 'MACD'); // MACD requer pelo menos 26 períodos
  
  const ema12 = calculateEMA(prices, 12);
  const ema26 = calculateEMA(prices, 26);
  
  // Calcular linha MACD (diferença entre EMA12 e EMA26)
  const macd: (number | null)[] = [];
  for (let i = 0; i < prices.length; i++) {
    if (ema12[i] === null || ema26[i] === null) {
      macd.push(null);
    } else {
      macd.push(ema12[i]! - ema26[i]!);
    }
  }
  
  // Calcular linha de sinal (EMA9 do MACD)
  const signal = calculateEMA(
    macd.filter((v): v is number => v !== null) as number[],
    9
  );
  
  // Ajustar tamanho do signal para corresponder ao MACD
  const adjustedSignal: (number | null)[] = [];
  const signalOffset = macd.length - signal.length;
  for (let i = 0; i < macd.length; i++) {
    if (i < signalOffset) {
      adjustedSignal.push(null);
    } else {
      adjustedSignal.push(signal[i - signalOffset]);
    }
  }
  
  // Calcular histograma (diferença entre MACD e signal)
  const histogram: (number | null)[] = [];
  for (let i = 0; i < macd.length; i++) {
    if (macd[i] === null || adjustedSignal[i] === null) {
      histogram.push(null);
    } else {
      histogram.push(macd[i]! - adjustedSignal[i]!);
    }
  }
  
  return {
    macd,
    signal: adjustedSignal,
    histogram
  };
}

/**
 * Bollinger Bands
 * 
 * @param prices - Array de preços
 * @param period - Período (padrão: 20)
 * @param stdDev - Desvio padrão (padrão: 2)
 * @returns Objeto com bandas superior, média e inferior
 */
export function calculateBollingerBands(
  prices: number[],
  period: number = 20,
  stdDev: number = 2
): {
  upper: (number | null)[];
  middle: (number | null)[];
  lower: (number | null)[];
} {
  validateInputs(prices, period, 'Bollinger Bands');
  
  const middle = calculateSMA(prices, period);
  const upper: (number | null)[] = [];
  const lower: (number | null)[] = [];
  
  for (let i = 0; i < prices.length; i++) {
    if (i < period - 1) {
      upper.push(null);
      lower.push(null);
    } else {
      // Calcular desvio padrão dos últimos 'period' preços
      let sum = 0;
      for (let j = i - period + 1; j <= i; j++) {
        sum += prices[j];
      }
      const mean = sum / period;
      
      let variance = 0;
      for (let j = i - period + 1; j <= i; j++) {
        variance += Math.pow(prices[j] - mean, 2);
      }
      const standardDeviation = Math.sqrt(variance / period);
      
      upper.push(mean + standardDeviation * stdDev);
      lower.push(mean - standardDeviation * stdDev);
    }
  }
  
  return { upper, middle, lower };
}

/**
 * Average True Range (ATR)
 * 
 * @param high - Array de preços máximos
 * @param low - Array de preços mínimos
 * @param close - Array de preços de fechamento
 * @param period - Período (padrão: 14)
 * @returns Array com valores ATR
 */
export function calculateATR(
  high: number[],
  low: number[],
  close: number[],
  period: number = 14
): (number | null)[] {
  // Validação básica
  if (!Array.isArray(high) || !Array.isArray(low) || !Array.isArray(close)) {
    throw new TypeError('ATR: high, low e close devem ser arrays');
  }
  
  if (high.length !== low.length || high.length !== close.length) {
    throw new Error('ATR: arrays devem ter o mesmo tamanho');
  }
  
  if (high.length === 0) {
    throw new Error('ATR: arrays vazios');
  }
  
  if (period <= 0 || period > high.length) {
    throw new Error(`ATR: período inválido (${period})`);
  }
  
  const trueRanges: number[] = [];
  
  // Calcular True Range para cada período
  for (let i = 0; i < high.length; i++) {
    if (i === 0) {
      trueRanges.push(high[i] - low[i]);
    } else {
      const tr1 = high[i] - low[i];
      const tr2 = Math.abs(high[i] - close[i - 1]);
      const tr3 = Math.abs(low[i] - close[i - 1]);
      trueRanges.push(Math.max(tr1, tr2, tr3));
    }
  }
  
  // Calcular ATR
  const atr: (number | null)[] = [];
  let atrValue: number | null = null;
  
  for (let i = 0; i < trueRanges.length; i++) {
    if (i < period - 1) {
      atr.push(null);
    } else if (i === period - 1) {
      // Primeiro ATR é a média dos primeiros 'period' TRs
      let sum = 0;
      for (let j = 0; j < period; j++) {
        sum += trueRanges[j];
      }
      atrValue = sum / period;
      atr.push(atrValue);
    } else {
      // ATR subsequente usando fórmula Wilder
      atrValue = (atrValue! * (period - 1) + trueRanges[i]) / period;
      atr.push(atrValue);
    }
  }
  
  return atr;
}

/**
 * Stochastic Oscillator
 * 
 * @param high - Array de preços máximos
 * @param low - Array de preços mínimos
 * @param close - Array de preços de fechamento
 * @param period - Período (padrão: 14)
 * @returns Objeto com linhas %K e %D
 */
export function calculateStochastic(
  high: number[],
  low: number[],
  close: number[],
  period: number = 14
): {
  k: (number | null)[];
  d: (number | null)[];
} {
  // Validação básica
  if (!Array.isArray(high) || !Array.isArray(low) || !Array.isArray(close)) {
    throw new TypeError('Stochastic: high, low e close devem ser arrays');
  }
  
  if (high.length !== low.length || high.length !== close.length) {
    throw new Error('Stochastic: arrays devem ter o mesmo tamanho');
  }
  
  if (high.length === 0) {
    throw new Error('Stochastic: arrays vazios');
  }
  
  if (period <= 0 || period > high.length) {
    throw new Error(`Stochastic: período inválido (${period})`);
  }
  
  const k: (number | null)[] = [];
  
  // Calcular %K
  for (let i = 0; i < close.length; i++) {
    if (i < period - 1) {
      k.push(null);
    } else {
      // Encontrar máximo e mínimo nos últimos 'period' períodos
      let highest = high[i];
      let lowest = low[i];
      
      for (let j = i - period + 1; j <= i; j++) {
        if (high[j] > highest) highest = high[j];
        if (low[j] < lowest) lowest = low[j];
      }
      
      const kValue = ((close[i] - lowest) / (highest - lowest)) * 100;
      k.push(kValue);
    }
  }
  
  // Calcular %D (SMA de 3 períodos do %K)
  const d = calculateSMA(
    k.filter((v): v is number => v !== null) as number[],
    3
  );
  
  // Ajustar tamanho do %D para corresponder ao %K
  const adjustedD: (number | null)[] = [];
  const dOffset = k.length - d.length;
  for (let i = 0; i < k.length; i++) {
    if (i < dOffset) {
      adjustedD.push(null);
    } else {
      adjustedD.push(d[i - dOffset]);
    }
  }
  
  return { k, d: adjustedD };
}

/**
 * Helper function para calcular múltiplos indicadores de uma vez
 */
export function calculateAllIndicators(prices: number[]) {
  return {
    sma20: calculateSMA(prices, 20),
    sma50: calculateSMA(prices, 50),
    sma200: calculateSMA(prices, 200),
    ema12: calculateEMA(prices, 12),
    ema26: calculateEMA(prices, 26),
    rsi: calculateRSI(prices, 14),
    macd: calculateMACD(prices),
    bollinger: calculateBollingerBands(prices, 20, 2)
  };
}

export default {
  calculateSMA,
  calculateEMA,
  calculateRSI,
  calculateMACD,
  calculateBollingerBands,
  calculateATR,
  calculateStochastic,
  calculateAllIndicators
};
