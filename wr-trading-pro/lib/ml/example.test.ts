/**
 * Testes para o sistema de Machine Learning
 */

import { Candle, DEFAULT_MODEL_CONFIG, DEFAULT_PREDICTION_CONFIG } from './types';
import {
  prepareTrainingData,
  trainModel,
  evaluateModel,
  predict,
  needsRetraining,
  needsNewPrediction
} from './price-prediction';

/**
 * Gera dados de teste
 */
function generateTestCandles(count: number): Candle[] {
  const candles: Candle[] = [];
  let price = 100;
  
  for (let i = 0; i < count; i++) {
    const timestamp = Date.now() - (count - i) * 60000; // 1 minuto entre candles
    const change = (Math.random() - 0.5) * 2; // -1 a +1
    const open = price;
    const close = price + change;
    const high = Math.max(open, close) + Math.random() * 0.5;
    const low = Math.min(open, close) - Math.random() * 0.5;
    const volume = Math.random() * 1000 + 100;
    
    candles.push({
      time: timestamp,
      open,
      high,
      low,
      close,
      volume
    });
    
    price = close;
  }
  
  return candles;
}

/**
 * Testes principais
 */
describe('Sistema de Machine Learning', () => {
  const symbol = 'TEST';
  const testCandles = generateTestCandles(1000);
  
  test('prepareTrainingData deve preparar dados de treinamento', () => {
    const trainingData = prepareTrainingData(testCandles, symbol);
    
    expect(trainingData).toBeDefined();
    expect(trainingData.trainX.length).toBeGreaterThan(0);
    expect(trainingData.trainY.length).toBeGreaterThan(0);
    expect(trainingData.trainX.length).toBe(trainingData.trainY.length);
    expect(trainingData.scaler).toBeDefined();
    expect(trainingData.scaler.min.length).toBeGreaterThan(0);
    expect(trainingData.scaler.max.length).toBeGreaterThan(0);
  });
  
  test('trainModel deve treinar modelo sem erros', async () => {
    const trainingData = prepareTrainingData(testCandles.slice(0, 300), symbol);
    
    const trainedModel = await trainModel(trainingData);
    
    expect(trainedModel).toBeDefined();
    expect(typeof trainedModel.predict).toBe('function');
  });
  
  test('evaluateModel deve calcular métricas', async () => {
    const trainingData = prepareTrainingData(testCandles.slice(0, 300), symbol);
    
    // Treina um modelo real para teste
    const trainedModel = await trainModel(trainingData);
    
    const metrics = evaluateModel(trainedModel, trainingData);
    
    expect(metrics).toBeDefined();
    expect(typeof metrics.mae).toBe('number');
    expect(typeof metrics.rmse).toBe('number');
    expect(typeof metrics.r2).toBe('number');
    expect(typeof metrics.mape).toBe('number');
    expect(typeof metrics.accuracy).toBe('number');
    expect(typeof metrics.sampleSize).toBe('number');
  });
  
  test('needsRetraining deve verificar corretamente', () => {
    const now = Date.now();
    const oneHourAgo = now - 60 * 60 * 1000;
    const twoHoursAgo = now - 2 * 60 * 60 * 1000;
    
    const metadata = {
      trainedAt: now,
      sampleSize: 100,
      version: '1.0',
      symbol: 'TEST',
      metrics: { mae: 0.1, rmse: 0.2, r2: 0.8, mape: 5, accuracy: 80, sampleSize: 100 },
      scaler: { min: [0], max: [1] }
    };
    
    const candles = generateTestCandles(100);
    
    expect(needsRetraining(metadata, candles)).toBe(false);
    
    const oldMetadata = {
      ...metadata,
      trainedAt: twoHoursAgo
    };
    
    expect(needsRetraining(oldMetadata, candles)).toBe(false);
    
    const smallCandles = generateTestCandles(50);
    expect(needsRetraining(metadata, smallCandles)).toBe(false);
  });
  
  test('needsNewPrediction deve verificar corretamente', () => {
    const now = Date.now();
    const sixMinutesAgo = now - 6 * 60 * 1000;
    const tenMinutesAgo = now - 10 * 60 * 1000;
    
    const recentPrediction = {
      price: 100,
      confidence: 80,
      range: { min: 98, max: 102 },
      timestamp: now
    };
    
    const oldPrediction = {
      price: 100,
      confidence: 80,
      range: { min: 98, max: 102 },
      timestamp: tenMinutesAgo
    };
    
    expect(needsNewPrediction(recentPrediction)).toBe(false);
    expect(needsNewPrediction(oldPrediction)).toBe(true);
  });
});

/**
 * Testes de integração
 */
describe('Integração do Sistema ML', () => {
  const symbol = 'INTEGRATION_TEST';
  const testCandles = generateTestCandles(500);
  
  test('Fluxo completo: treinar -> prever', async () => {
    // 1. Prepara dados
    const trainingData = prepareTrainingData(testCandles, symbol);
    
    // 2. Treina modelo
    const trainedModel = await trainModel(trainingData);
    
    // 3. Avalia modelo
    const metrics = evaluateModel(trainedModel, trainingData);
    expect(metrics.accuracy).toBeGreaterThan(0);
    
    // 4. Faz previsão
    const prediction = await predict(trainedModel, trainingData);
    expect(prediction).toBeDefined();
    expect(prediction.price).toBeGreaterThan(0);
    expect(prediction.confidence).toBeGreaterThanOrEqual(0);
    expect(prediction.confidence).toBeLessThanOrEqual(100);
    expect(prediction.range).toBeDefined();
    expect(prediction.range.min).toBeLessThanOrEqual(prediction.range.max);
    expect(prediction.timestamp).toBeGreaterThan(0);
  });
  
  test('Tratamento de erros', () => {
    // Dados insuficientes
    expect(() => {
      prepareTrainingData([], 'TEST');
    }).toThrow();
    
    // Dados insuficientes para treinamento
    expect(() => {
      prepareTrainingData(testCandles.slice(0, 10), 'TEST');
    }).toThrow();
  });
});

/**
 * Testes de performance
 */
describe('Performance do Sistema ML', () => {
  const symbol = 'PERF_TEST';
  const largeTestCandles = generateTestCandles(5000);
  
  test('prepareTrainingData deve lidar com grandes datasets', () => {
    const startTime = performance.now();
    
    const trainingData = prepareTrainingData(largeTestCandles, symbol);
    
    const endTime = performance.now();
    const duration = endTime - startTime;
    
    expect(trainingData.trainX.length).toBeGreaterThan(0);
    expect(duration).toBeLessThan(5000); // Menos de 5 segundos
  });
});

export {};
