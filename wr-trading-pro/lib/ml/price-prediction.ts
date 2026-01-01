import * as tf from '@tensorflow/tfjs';
import type { Candle, TrainingData, Scaler, Prediction, Metrics } from './types';

// Constantes
const MIN_CANDLES_FOR_TRAINING = 30; // Reduzido de 60 para 30 para testes
const SEQUENCE_LENGTH = 10;
const FEATURES_COUNT = 10;

/**
 * Calcula indicadores técnicos básicos
 */
function calculateIndicators(candles: Candle[]): {
  sma5: number[];
  sma10: number[];
  sma20: number[];
  rsi: number[];
  macd: number[];
  signal: number[];
  histogram: number[];
} {
  const closes = candles.map(c => c.close);
  
  // SMA
  const sma5 = calculateSMA(closes, 5);
  const sma10 = calculateSMA(closes, 10);
  const sma20 = calculateSMA(closes, 20);
  
  // RSI
  const rsi = calculateRSI(closes, 14);
  
  // MACD
  const { macd, signal, histogram } = calculateMACD(closes);
  
  return { sma5, sma10, sma20, rsi, macd, signal, histogram };
}

function calculateSMA(data: number[], period: number): number[] {
  const result: number[] = [];
  for (let i = 0; i < data.length; i++) {
    if (i < period - 1) {
      result.push(data[i]); // Usar valor atual se não tiver período completo
    } else {
      const sum = data.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0);
      result.push(sum / period);
    }
  }
  return result;
}

function calculateRSI(data: number[], period: number = 14): number[] {
  const result: number[] = [];
  const gains: number[] = [];
  const losses: number[] = [];
  
  for (let i = 1; i < data.length; i++) {
    const change = data[i] - data[i - 1];
    gains.push(change > 0 ? change : 0);
    losses.push(change < 0 ? Math.abs(change) : 0);
  }
  
  for (let i = 0; i < data.length; i++) {
    if (i < period) {
      result.push(50); // Valor neutro
    } else {
      const avgGain = gains.slice(i - period, i).reduce((a, b) => a + b, 0) / period;
      const avgLoss = losses.slice(i - period, i).reduce((a, b) => a + b, 0) / period;
      
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

function calculateMACD(data: number[]): {
  macd: number[];
  signal: number[];
  histogram: number[];
} {
  const ema12 = calculateEMA(data, 12);
  const ema26 = calculateEMA(data, 26);
  
  const macd = ema12.map((val, i) => val - ema26[i]);
  const signal = calculateEMA(macd, 9);
  const histogram = macd.map((val, i) => val - signal[i]);
  
  return { macd, signal, histogram };
}

function calculateEMA(data: number[], period: number): number[] {
  const k = 2 / (period + 1);
  const result: number[] = [data[0]];
  
  for (let i = 1; i < data.length; i++) {
    result.push(data[i] * k + result[i - 1] * (1 - k));
  }
  
  return result;
}

/**
 * Normaliza dados usando min-max scaling
 */
function normalize(data: number[][]): { normalized: number[][]; scaler: Scaler } {
  const numFeatures = data[0].length;
  const min: number[] = new Array(numFeatures).fill(Infinity);
  const max: number[] = new Array(numFeatures).fill(-Infinity);
  
  // Encontrar min e max de cada feature
  data.forEach(row => {
    row.forEach((val, i) => {
      if (val < min[i]) min[i] = val;
      if (val > max[i]) max[i] = val;
    });
  });
  
  // Normalizar
  const normalized = data.map(row =>
    row.map((val, i) => {
      const range = max[i] - min[i];
      return range === 0 ? 0 : (val - min[i]) / range;
    })
  );
  
  return { normalized, scaler: { min, max } };
}

/**
 * Desnormaliza um valor
 */
function denormalize(value: number, featureIndex: number, scaler: Scaler): number {
  const range = scaler.max[featureIndex] - scaler.min[featureIndex];
  return value * range + scaler.min[featureIndex];
}

/**
 * Cria um modelo neural
 */
export function createModel(inputShape: number): any {
  return tf.sequential({
    layers: [
      tf.layers.dense({ units: 32, activation: 'relu', inputShape: [inputShape] }),
      tf.layers.dropout({ rate: 0.2 }),
      tf.layers.dense({ units: 16, activation: 'relu' }),
      tf.layers.dropout({ rate: 0.2 }),
      tf.layers.dense({ units: 1, activation: 'linear' })
    ]
  });
}

/**
 * Prepara dados para treinamento
 */
export function prepareTrainingData(candles: Candle[], symbol?: string): TrainingData {
  console.log(`📊 prepareTrainingData: Recebidos ${candles.length} candles`);
  
  // VALIDAÇÃO MELHORADA
  if (!candles || !Array.isArray(candles)) {
    throw new Error('MLError: Candles deve ser um array');
  }
  
  if (candles.length < MIN_CANDLES_FOR_TRAINING) {
    throw new Error(`MLError: Dados insuficientes para treinamento. Necessário: ${MIN_CANDLES_FOR_TRAINING}, Recebido: ${candles.length}`);
  }
  
  // Validar estrutura dos candles
  const firstCandle = candles[0];
  if (!firstCandle || typeof firstCandle.close !== 'number') {
    console.error('Estrutura do primeiro candle:', firstCandle);
    throw new Error('MLError: Estrutura de candle inválida');
  }
  
  console.log('✅ Validação inicial passou');
  
  try {
    // Calcular indicadores
    console.log('⚙️ Calculando indicadores técnicos...');
    const indicators = calculateIndicators(candles);
    console.log('✅ Indicadores calculados');
    
    // Criar features
    const features: number[][] = [];
    const labels: number[] = [];
    
    for (let i = SEQUENCE_LENGTH; i < candles.length - 1; i++) {
      const feature = [
        indicators.sma5[i],
        indicators.sma10[i],
        indicators.sma20[i],
        indicators.rsi[i],
        indicators.macd[i],
        indicators.signal[i],
        indicators.histogram[i],
        candles[i].volume,
        candles[i].high,
        candles[i].low,
      ];
      
      // Validar feature
      if (feature.some(val => !isFinite(val))) {
        console.warn(`Feature inválida no índice ${i}, pulando...`);
        continue;
      }
      
      features.push(feature);
      labels.push(candles[i + 1].close); // Preço futuro
    }
    
    console.log(`✅ Features criadas: ${features.length} amostras`);
    
    if (features.length < 20) {
      throw new Error(`MLError: Amostras insuficientes após processamento. Obtido: ${features.length}, Mínimo: 20`);
    }
    
    // Normalizar features
    console.log('⚙️ Normalizando dados...');
    const { normalized: normalizedFeatures, scaler: featureScaler } = normalize(features);
    
    // Normalizar labels
    const labelsArray = labels.map(l => [l]);
    const { normalized: normalizedLabels, scaler: labelScaler } = normalize(labelsArray);
    const flatLabels = normalizedLabels.map(l => l[0]);
    
    // Combinar scalers (usar scaler de labels para feature 0, que representa o preço)
    const scaler: Scaler = {
      min: [labelScaler.min[0], ...featureScaler.min.slice(1)],
      max: [labelScaler.max[0], ...featureScaler.max.slice(1)]
    };
    
    // Dividir em treino e teste (80/20)
    const splitIndex = Math.floor(features.length * 0.8);
    
    const trainX = normalizedFeatures.slice(0, splitIndex);
    const trainY = flatLabels.slice(0, splitIndex);
    const testX = normalizedFeatures.slice(splitIndex);
    const testY = flatLabels.slice(splitIndex);
    
    console.log(`✅ Dados preparados: ${trainX.length} treino, ${testX.length} teste`);
    
    return { trainX, trainY, testX, testY, scaler };
    
  } catch (error) {
    console.error('❌ Erro ao preparar dados:', error);
    throw error;
  }
}

/**
 * Treina o modelo
 */
export async function trainModel(data: TrainingData): Promise<any> {
  console.log('🧠 Criando modelo neural...');
  
  const model = tf.sequential({
    layers: [
      tf.layers.dense({ units: 32, activation: 'relu', inputShape: [FEATURES_COUNT] }),
      tf.layers.dropout({ rate: 0.2 }),
      tf.layers.dense({ units: 16, activation: 'relu' }),
      tf.layers.dropout({ rate: 0.2 }),
      tf.layers.dense({ units: 1, activation: 'linear' })
    ]
  });
  
  model.compile({
    optimizer: tf.train.adam(0.001),
    loss: 'meanSquaredError',
    metrics: ['mae']
  });
  
  console.log('✅ Modelo criado');
  console.log('🏋️ Treinando modelo...');
  
  const xs = tf.tensor2d(data.trainX);
  const ys = tf.tensor1d(data.trainY);
  
  await model.fit(xs, ys, {
    epochs: 100,
    batchSize: 32,
    validationSplit: 0.2,
    verbose: 0,
    callbacks: {
      onEpochEnd: (epoch, logs) => {
        if (epoch % 10 === 0) {
          console.log(`Epoch ${epoch}: loss = ${logs?.loss.toFixed(4)}, mae = ${logs?.mae.toFixed(4)}`);
        }
      }
    }
  });
  
  xs.dispose();
  ys.dispose();
  
  console.log('✅ Treinamento concluído');
  
  return model;
}

/**
 * Verifica se o modelo precisa ser retreinado
 */
export function needsRetraining(metadata: any | null, candles: Candle[]): boolean {
  if (!metadata) return true;
  
  const hoursSinceLastTrain = (Date.now() - metadata.trainedAt) / (1000 * 60 * 60);
  const needsByTime = hoursSinceLastTrain >= 24;
  
  const needsByData = candles.length > metadata.sampleSize * 1.5;
  
  return needsByTime || needsByData;
}

/**
 * Verifica se precisa fazer nova previsão
 */
export function needsNewPrediction(lastPrediction: Prediction | null): boolean {
  if (!lastPrediction) return true;
  
  const minutesSincePrediction = (Date.now() - lastPrediction.timestamp) / (1000 * 60);
  return minutesSincePrediction >= 5;
}

/**
 * Faz previsão
 */
export async function predict(
  model: any,
  currentData: { candles: Candle[]; scaler: Scaler } | any,
  candlesOverride?: Candle[]
): Promise<Prediction> {
  let candles, scaler;
  
  // Verificar se tem candles em currentData (é TrainingData ou similar)
  if (currentData.candles && Array.isArray(currentData.candles) && currentData.candles.length > 0) {
    // É { candles, scaler }
    candles = currentData.candles;
    scaler = currentData.scaler;
    console.log('🔍 Usando candles de currentData:', candles.length);
  } else {
    // É ModelMetadata - usar candlesOverride
    console.log('🔍 candlesOverride recebido:', candlesOverride?.length, 'candles');
    if (!candlesOverride || !Array.isArray(candlesOverride) || candlesOverride.length < SEQUENCE_LENGTH) {
      throw new Error(`candlesOverride é obrigatório quando currentData é ModelMetadata. Recebido: ${candlesOverride?.length || 0}, Mínimo: ${SEQUENCE_LENGTH}`);
    }
    candles = candlesOverride;
    scaler = currentData.scaler;
    console.log('🔍 Usando candlesOverride:', candles.length);
  }
  
  if (!candles || candles.length < SEQUENCE_LENGTH) {
    throw new Error('Dados insuficientes para previsão');
  }
  
  // Calcular indicadores
  const indicators = calculateIndicators(candles);
  const lastIndex = candles.length - 1;
  
  // Criar feature
  const feature = [
    indicators.sma5[lastIndex],
    indicators.sma10[lastIndex],
    indicators.sma20[lastIndex],
    indicators.rsi[lastIndex],
    indicators.macd[lastIndex],
    indicators.signal[lastIndex],
    indicators.histogram[lastIndex],
    candles[lastIndex].volume,
    candles[lastIndex].high,
    candles[lastIndex].low,
  ];
  
  // Verificar se scaler é válido
  if (!scaler || !scaler.min || !scaler.max || scaler.min.length !== scaler.max.length) {
    throw new Error('Scaler inválido para previsão');
  }
  
  // Normalizar
  const normalizedFeature = feature.map((val, i) => {
    const range = scaler.max[i] - scaler.min[i];
    return range === 0 ? 0 : (val - scaler.min[i]) / range;
  });
  
  // Prever
  const input = tf.tensor2d([normalizedFeature]);
  const prediction = model.predict(input) as tf.Tensor;
  const normalizedPrice = (await prediction.data())[0];
  
  input.dispose();
  prediction.dispose();
  
  // Desnormalizar
  const predictedPrice = denormalize(normalizedPrice, 0, scaler);
  
  // Calcular intervalo de confiança (±2% do preço previsto)
  const confidence = Math.min(95, Math.max(50, 100 - Math.abs(normalizedPrice - 0.5) * 100));
  const range = {
    min: predictedPrice * 0.98,
    max: predictedPrice * 1.02
  };
  
  return {
    price: predictedPrice,
    confidence,
    range,
    timestamp: Date.now()
  };
}

/**
 * Avalia o modelo
 */
export function evaluateModel(model: any, testData: TrainingData): Metrics {
  const xs = tf.tensor2d(testData.testX);
  const ys = tf.tensor1d(testData.testY);
  
  const predictions = model.predict(xs) as tf.Tensor;
  const predArray = predictions.dataSync();
  const trueArray = ys.dataSync();
  
  // Calcular métricas
  let sumAbsError = 0;
  let sumSqError = 0;
  let sumTrue = 0;
  let sumTrueSq = 0;
  let accurateCount = 0;
  
  for (let i = 0; i < predArray.length; i++) {
    const error = Math.abs(predArray[i] - trueArray[i]);
    sumAbsError += error;
    sumSqError += error * error;
    sumTrue += trueArray[i];
    sumTrueSq += trueArray[i] * trueArray[i];
    
    // Considerar acurado se erro < 5% (mais realista para forex/crypto)
    if (error / trueArray[i] < 0.05) {
      accurateCount++;
    }
  }
  
  const n = predArray.length;
  const mae = sumAbsError / n;
  const rmse = Math.sqrt(sumSqError / n);
  
  // R²
  const meanTrue = sumTrue / n;
  let ssRes = 0;
  let ssTot = 0;
  for (let i = 0; i < n; i++) {
    ssRes += Math.pow(trueArray[i] - predArray[i], 2);
    ssTot += Math.pow(trueArray[i] - meanTrue, 2);
  }
  const r2 = 1 - (ssRes / ssTot);
  
  const mape = (sumAbsError / sumTrue) * 100;
  const accuracy = (accurateCount / n) * 100;
  
  xs.dispose();
  ys.dispose();
  predictions.dispose();
  
  return {
    mae,
    rmse,
    r2,
    mape,
    accuracy,
    sampleSize: n
  };
}

/**
 * Salva modelo (placeholder - implementar com IndexedDB)
 */
export async function saveModel(model: any, metadata: any): Promise<void> {
  console.log('💾 Salvando modelo...', metadata);
  // TODO: Implementar salvamento em IndexedDB
}

/**
 * Carrega modelo (placeholder - implementar com IndexedDB)
 */
export async function loadModel(symbol: string): Promise<any> {
  console.log('📂 Carregando modelo para', symbol);
  // TODO: Implementar carregamento de IndexedDB
  return null;
}
