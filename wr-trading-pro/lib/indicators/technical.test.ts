/**
 * Testes unitários para indicadores técnicos
 * 
 * @jest-environment node
 */

import {
  calculateSMA,
  calculateEMA,
  calculateRSI,
  calculateMACD,
  calculateBollingerBands,
  calculateATR,
  calculateStochastic,
  calculateAllIndicators
} from './technical';

describe('Technical Indicators', () => {
  const samplePrices = [100, 102, 101, 103, 105, 104, 106, 108, 107, 109];
  const sampleHigh = [101, 103, 102, 104, 106, 105, 107, 109, 108, 110];
  const sampleLow = [99, 101, 100, 102, 104, 103, 105, 107, 106, 108];
  const sampleClose = [100, 102, 101, 103, 105, 104, 106, 108, 107, 109];

  describe('calculateSMA', () => {
    test('calcula SMA corretamente para período 3', () => {
      const prices = [100, 102, 101, 103, 105, 104, 106];
      const result = calculateSMA(prices, 3);
      
      // Verificar primeiros 2 valores são null
      expect(result[0]).toBeNull();
      expect(result[1]).toBeNull();
      
      // Verificar valores SMA
      expect(result[2]).toBeCloseTo((100 + 102 + 101) / 3); // 101
      expect(result[3]).toBeCloseTo((102 + 101 + 103) / 3); // 102
      expect(result[4]).toBeCloseTo((101 + 103 + 105) / 3); // 103
      expect(result[5]).toBeCloseTo((103 + 105 + 104) / 3); // 104
      expect(result[6]).toBeCloseTo((105 + 104 + 106) / 3); // 105
    });

    test('lança erro para array vazio', () => {
      expect(() => calculateSMA([], 3)).toThrow('SMA: array de preços vazio');
    });

    test('lança erro para período inválido', () => {
      const prices = [100, 102, 101];
      expect(() => calculateSMA(prices, 0)).toThrow('SMA: período inválido (0)');
      expect(() => calculateSMA(prices, -1)).toThrow('SMA: período inválido (-1)');
      expect(() => calculateSMA(prices, 5)).toThrow('SMA: período (5) maior que tamanho do array (3)');
    });
  });

  describe('calculateEMA', () => {
    test('calcula EMA corretamente para período 3', () => {
      const prices = [100, 102, 101, 103, 105];
      const result = calculateEMA(prices, 3);
      
      // Verificar primeiros 2 valores são null
      expect(result[0]).toBeNull();
      expect(result[1]).toBeNull();
      
      // Primeiro EMA é SMA
      expect(result[2]).toBeCloseTo((100 + 102 + 101) / 3); // 101
      
      // EMA subsequentes
      const multiplier = 2 / (3 + 1); // 0.5
      const expectedEMA3 = (103 - 101) * multiplier + 101; // 102
      expect(result[3]).toBeCloseTo(expectedEMA3);
      
      const expectedEMA4 = (105 - 102) * multiplier + 102; // 103.5
      expect(result[4]).toBeCloseTo(expectedEMA4);
    });

    test('retorna array do mesmo tamanho que input', () => {
      const result = calculateEMA(samplePrices, 3);
      expect(result).toHaveLength(samplePrices.length);
    });
  });

  describe('calculateRSI', () => {
    test('calcula RSI corretamente para período 3', () => {
      const prices = [100, 102, 101, 103, 105, 104, 106];
      const result = calculateRSI(prices, 3);
      
      // Verificar primeiros 3 valores são null
      expect(result[0]).toBeNull();
      expect(result[1]).toBeNull();
      expect(result[2]).toBeNull();
      
      // RSI deve estar entre 0 e 100
      for (let i = 3; i < result.length; i++) {
        if (result[i] !== null) {
          expect(result[i]).toBeGreaterThanOrEqual(0);
          expect(result[i]).toBeLessThanOrEqual(100);
        }
      }
    });

    test('RSI é 100 quando não há perdas', () => {
      const prices = [100, 101, 102, 103, 104]; // Apenas ganhos
      const result = calculateRSI(prices, 2);
      
      // Ignorar valores null
      const rsiValues = result.filter(v => v !== null);
      expect(rsiValues.every(v => v === 100)).toBe(true);
    });
  });

  describe('calculateMACD', () => {
    test('retorna objeto com macd, signal e histogram', () => {
      // Usar array maior para MACD que precisa de pelo menos 26 períodos
      const macdPrices = Array.from({ length: 50 }, (_, i) => 100 + Math.sin(i * 0.1) * 10);
      const result = calculateMACD(macdPrices);
      
      expect(result).toHaveProperty('macd');
      expect(result).toHaveProperty('signal');
      expect(result).toHaveProperty('histogram');
      
      expect(result.macd).toHaveLength(macdPrices.length);
      expect(result.signal).toHaveLength(macdPrices.length);
      expect(result.histogram).toHaveLength(macdPrices.length);
    });

    test('histogram é diferença entre macd e signal', () => {
      const macdPrices = Array.from({ length: 50 }, (_, i) => 100 + Math.sin(i * 0.1) * 10);
      const result = calculateMACD(macdPrices);
      
      for (let i = 0; i < result.macd.length; i++) {
        if (result.macd[i] !== null && result.signal[i] !== null) {
          expect(result.histogram[i]).toBeCloseTo(result.macd[i]! - result.signal[i]!);
        }
      }
    });
  });

  describe('calculateBollingerBands', () => {
    test('retorna objeto com upper, middle e lower bands', () => {
      const result = calculateBollingerBands(samplePrices, 3, 2);
      
      expect(result).toHaveProperty('upper');
      expect(result).toHaveProperty('middle');
      expect(result).toHaveProperty('lower');
      
      expect(result.upper).toHaveLength(samplePrices.length);
      expect(result.middle).toHaveLength(samplePrices.length);
      expect(result.lower).toHaveLength(samplePrices.length);
    });

    test('middle band é SMA', () => {
      const period = 3;
      const result = calculateBollingerBands(samplePrices, period, 2);
      const sma = calculateSMA(samplePrices, period);
      
      for (let i = 0; i < result.middle.length; i++) {
        expect(result.middle[i]).toBe(sma[i]);
      }
    });

    test('upper band > middle band > lower band', () => {
      const result = calculateBollingerBands(samplePrices, 3, 2);
      
      for (let i = 0; i < result.upper.length; i++) {
        if (result.upper[i] !== null && result.middle[i] !== null && result.lower[i] !== null) {
          expect(result.upper[i]).toBeGreaterThan(result.middle[i]!);
          expect(result.middle[i]).toBeGreaterThan(result.lower[i]!);
        }
      }
    });
  });

  describe('calculateATR', () => {
    test('calcula ATR corretamente', () => {
      const result = calculateATR(sampleHigh, sampleLow, sampleClose, 3);
      
      // Verificar primeiros 2 valores são null
      expect(result[0]).toBeNull();
      expect(result[1]).toBeNull();
      
      // ATR deve ser positivo
      const atrValues = result.filter(v => v !== null);
      expect(atrValues.every(v => v! > 0)).toBe(true);
    });

    test('lança erro para arrays de tamanhos diferentes', () => {
      expect(() => calculateATR([1, 2], [1], [1, 2])).toThrow(
        'ATR: arrays devem ter o mesmo tamanho'
      );
    });
  });

  describe('calculateStochastic', () => {
    test('retorna objeto com k e d lines', () => {
      const result = calculateStochastic(sampleHigh, sampleLow, sampleClose, 3);
      
      expect(result).toHaveProperty('k');
      expect(result).toHaveProperty('d');
      
      expect(result.k).toHaveLength(sampleClose.length);
      expect(result.d).toHaveLength(sampleClose.length);
    });

    test('%K está entre 0 e 100', () => {
      const result = calculateStochastic(sampleHigh, sampleLow, sampleClose, 3);
      
      const kValues = result.k.filter(v => v !== null);
      expect(kValues.every(v => v >= 0 && v <= 100)).toBe(true);
    });

    test('%D é SMA de 3 períodos do %K', () => {
      const result = calculateStochastic(sampleHigh, sampleLow, sampleClose, 3);
      
      // Filtrar valores não null
      const kValues = result.k.filter(v => v !== null) as number[];
      const dExpected = calculateSMA(kValues, 3);
      
      // Comparar valores não null
      const dValues = result.d.filter(v => v !== null);
      const dExpectedValues = dExpected.filter(v => v !== null);
      
      expect(dValues.length).toBe(dExpectedValues.length);
      
      for (let i = 0; i < dValues.length; i++) {
        expect(dValues[i]).toBeCloseTo(dExpectedValues[i]!);
      }
    });
  });

  describe('calculateAllIndicators', () => {
    test('calcula todos os indicadores de uma vez', () => {
      const allPrices = Array.from({ length: 250 }, (_, i) => 100 + Math.sin(i * 0.1) * 10);
      const result = calculateAllIndicators(allPrices);
      
      expect(result).toHaveProperty('sma20');
      expect(result).toHaveProperty('sma50');
      expect(result).toHaveProperty('sma200');
      expect(result).toHaveProperty('ema12');
      expect(result).toHaveProperty('ema26');
      expect(result).toHaveProperty('rsi');
      expect(result).toHaveProperty('macd');
      expect(result).toHaveProperty('bollinger');
      
      expect(result.macd).toHaveProperty('macd');
      expect(result.macd).toHaveProperty('signal');
      expect(result.macd).toHaveProperty('histogram');
      
      expect(result.bollinger).toHaveProperty('upper');
      expect(result.bollinger).toHaveProperty('middle');
      expect(result.bollinger).toHaveProperty('lower');
    });
  });

  describe('Validação de inputs', () => {
    test('lança erro para preços não numéricos', () => {
      expect(() => calculateSMA([100, NaN, 102], 2)).toThrow(
        'SMA: preço inválido na posição 1: NaN'
      );
      
      expect(() => calculateSMA([100, 'abc' as any, 102], 2)).toThrow(
        'SMA: preço inválido na posição 1: abc'
      );
    });

    test('lança erro para input não array', () => {
      expect(() => calculateSMA('not array' as any, 2)).toThrow(
        'SMA: prices deve ser um array'
      );
    });
  });
});

// Testes de performance
describe('Performance', () => {
  test('calcula indicadores rapidamente para arrays grandes', () => {
    const largePrices = Array.from({ length: 1000 }, (_, i) => 100 + Math.sin(i * 0.1) * 10);
    
    const startTime = performance.now();
    
    const sma = calculateSMA(largePrices, 20);
    const ema = calculateEMA(largePrices, 20);
    const rsi = calculateRSI(largePrices, 14);
    
    const endTime = performance.now();
    const executionTime = endTime - startTime;
    
    // Deve executar em menos de 100ms
    expect(executionTime).toBeLessThan(100);
    
    // Verificar resultados
    expect(sma).toHaveLength(largePrices.length);
    expect(ema).toHaveLength(largePrices.length);
    expect(rsi).toHaveLength(largePrices.length);
  });
});

// Testes de casos de borda
describe('Casos de borda', () => {
  test('lida com array de um elemento', () => {
    const singlePrice = [100];
    
    expect(() => calculateSMA(singlePrice, 1)).not.toThrow();
    const sma = calculateSMA(singlePrice, 1);
    expect(sma[0]).toBe(100);
  });

    test('lida com valores extremos', () => {
      const extremePrices = [0, 1e6, -1e6, Infinity, -Infinity];
      
      // Infinity e -Infinity devem causar erro
      expect(() => calculateSMA(extremePrices, 2)).toThrow();
      
      // Valores normais extremos funcionam
      const normalExtreme = [0, 1e6, -1e6];
      expect(() => calculateSMA(normalExtreme, 2)).not.toThrow();
    });

  test('lida com períodos iguais ao tamanho do array', () => {
    const prices = [100, 102, 101];
    const sma = calculateSMA(prices, 3);
    
    expect(sma[0]).toBeNull();
    expect(sma[1]).toBeNull();
    expect(sma[2]).toBeCloseTo((100 + 102 + 101) / 3);
  });
});
