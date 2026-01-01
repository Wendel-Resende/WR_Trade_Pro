/**
 * Tipos para sistema de Machine Learning de previsão de preços
 */

export interface Candle {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface TrainingData {
  trainX: number[][];
  trainY: number[];
  testX: number[][];
  testY: number[];
  scaler: Scaler;
}

export interface Scaler {
  min: number[];
  max: number[];
}

export interface Prediction {
  price: number;
  confidence: number;
  range: {
    min: number;
    max: number;
  };
  timestamp: number;
}

export interface Metrics {
  mae: number;
  rmse: number;
  r2: number;
  mape: number;
  accuracy: number;
  sampleSize: number;
}

export interface ModelMetadata {
  version: string;
  trainedAt: number;
  symbol: string;
  metrics: Metrics;
  scaler: Scaler;
  sampleSize: number;
}

/**
 * Configurações do modelo
 */
export interface ModelConfig {
  epochs: number;
  batchSize: number;
  learningRate: number;
  validationSplit: number;
  architecture: number[];
  activation: string;
  optimizer: string;
  loss: string;
  metrics: string[];
}

/**
 * Configurações padrão do modelo
 */
export const DEFAULT_MODEL_CONFIG: ModelConfig = {
  epochs: 50,
  batchSize: 32,
  learningRate: 0.001,
  validationSplit: 0.2,
  architecture: [32, 16],
  activation: 'relu',
  optimizer: 'adam',
  loss: 'meanSquaredError',
  metrics: ['mae']
};

/**
 * Configurações de previsão
 */
export interface PredictionConfig {
  lookbackPeriod: number; // Períodos para lookback
  forecastPeriod: number; // Períodos para previsão
  minSamples: number;     // Mínimo de amostras para treinar
  retrainIntervalHours: number; // Intervalo para retreinar
  predictionIntervalMinutes: number; // Intervalo para prever
}

/**
 * Configurações padrão de previsão
 */
export const DEFAULT_PREDICTION_CONFIG: PredictionConfig = {
  lookbackPeriod: 10,
  forecastPeriod: 1,
  minSamples: 1000,
  retrainIntervalHours: 24,
  predictionIntervalMinutes: 5
};

/**
 * Erros do sistema ML
 */
export class MLError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: any
  ) {
    super(message);
    this.name = 'MLError';
  }
}

/**
 * Status do modelo
 */
export enum ModelStatus {
  NOT_TRAINED = 'NOT_TRAINED',
  TRAINING = 'TRAINING',
  TRAINED = 'TRAINED',
  PREDICTING = 'PREDICTING',
  ERROR = 'ERROR'
}
