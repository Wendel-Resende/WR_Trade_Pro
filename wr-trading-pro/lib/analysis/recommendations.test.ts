import { analyzeAsset, MarketData, DEFAULT_CONFIG } from './recommendations';

describe('Sistema de Recomendações', () => {
  // Dados de teste - precisa de pelo menos 200 para SMA200
  const createTestData = (): MarketData => ({
    symbol: 'AAPL',
    prices: Array.from({ length: 250 }, (_, i) => 
      150 + Math.sin(i * 0.1) * 10 + Math.random() * 2
    ),
    currentPrice: 155.50,
    timestamp: new Date()
  });

  test('analisa ativo com dados suficientes', () => {
    const data = createTestData();
    const recommendation = analyzeAsset(data);

    expect(recommendation).toHaveProperty('symbol', 'AAPL');
    expect(recommendation).toHaveProperty('signal');
    expect(['BUY', 'SELL', 'HOLD']).toContain(recommendation.signal);
    expect(recommendation).toHaveProperty('strength');
    expect(recommendation.strength).toBeGreaterThanOrEqual(0);
    expect(recommendation.strength).toBeLessThanOrEqual(100);
    expect(recommendation).toHaveProperty('confidence');
    expect(recommendation.confidence).toBeGreaterThanOrEqual(0);
    expect(recommendation.confidence).toBeLessThanOrEqual(100);
    expect(recommendation).toHaveProperty('reasons');
    expect(Array.isArray(recommendation.reasons)).toBe(true);
    expect(recommendation).toHaveProperty('indicators');
    expect(recommendation.indicators).toHaveProperty('rsi');
    expect(recommendation.indicators).toHaveProperty('macd');
    expect(recommendation.indicators).toHaveProperty('bollinger');
    expect(recommendation.indicators).toHaveProperty('trend');
  });

  test('lança erro para dados insuficientes', () => {
    const data: MarketData = {
      symbol: 'TEST',
      prices: Array.from({ length: 10 }, (_, i) => 100 + i),
      currentPrice: 105
    };

    expect(() => analyzeAsset(data)).toThrow('Dados insuficientes para análise');
  });

  test('calcula pontuação corretamente', () => {
    const data = createTestData();
    const recommendation = analyzeAsset(data);

    // Verifica que a pontuação está dentro dos limites esperados
    expect(recommendation.score).toBeGreaterThanOrEqual(-60);
    expect(recommendation.score).toBeLessThanOrEqual(60);
  });

  test('gera razões baseadas nos indicadores', () => {
    const data = createTestData();
    const recommendation = analyzeAsset(data);

    expect(recommendation.reasons.length).toBeGreaterThan(0);
    expect(recommendation.reasons.every(reason => typeof reason === 'string')).toBe(true);
  });

  test('configurações padrão são aplicadas', () => {
    const data = createTestData();
    const recommendation = analyzeAsset(data, DEFAULT_CONFIG);

    expect(recommendation).toBeDefined();
  });

  test('target price e stop loss são calculados para sinais BUY/SELL', () => {
    const data = createTestData();
    const recommendation = analyzeAsset(data);

    if (recommendation.signal === 'BUY' || recommendation.signal === 'SELL') {
      expect(recommendation.targetPrice).toBeDefined();
      expect(recommendation.stopLoss).toBeDefined();
      expect(typeof recommendation.targetPrice).toBe('number');
      expect(typeof recommendation.stopLoss).toBe('number');
    }
  });

  test('indicadores individuais têm valores válidos', () => {
    const data = createTestData();
    const recommendation = analyzeAsset(data);

    expect(typeof recommendation.indicators.rsi.value).toBe('number');
    expect(['BUY', 'SELL', 'NEUTRAL']).toContain(recommendation.indicators.rsi.signal);
    
    expect(typeof recommendation.indicators.macd.value).toBe('number');
    expect(['BUY', 'SELL', 'NEUTRAL']).toContain(recommendation.indicators.macd.signal);
    
    expect(typeof recommendation.indicators.bollinger.value).toBe('number');
    expect(['BUY', 'SELL', 'NEUTRAL']).toContain(recommendation.indicators.bollinger.signal);
    
    expect(typeof recommendation.indicators.trend.value).toBe('string');
    expect(['BUY', 'SELL', 'NEUTRAL']).toContain(recommendation.indicators.trend.signal);
  });
});
