'use client';

import { useState, useCallback, useRef } from 'react';
import { 
  prepareTrainingData, 
  trainModel, 
  predict, 
  evaluateModel,
} from '@/lib/ml/price-prediction';
import type { Prediction, Metrics, ModelMetadata } from '@/lib/ml/types';
import type { Candle } from '@/lib/ml/types';

export type PredictionTimeframe = 'hourly' | 'daily' | 'weekly' | 'yearly';

export function usePricePrediction(symbol: string, candles: Candle[]) {
  const [prediction, setPrediction] = useState<Prediction | null>(null);
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isTraining, setIsTraining] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [lastTrainedAt, setLastTrainedAt] = useState<number | null>(null);
  const [selectedTimeframe, setSelectedTimeframe] = useState<PredictionTimeframe>('daily');
  const [isModelReady, setIsModelReady] = useState(false);
  
  const modelRef = useRef<any>(null);
  const metadataRef = useRef<ModelMetadata | null>(null);
  const isTrainingRef = useRef(false);

  // Calcular horizonte de previsão baseado no timeframe
  const getPredictionHorizon = (timeframe: PredictionTimeframe): number => {
    switch (timeframe) {
      case 'hourly': return 3600; // 1 hora em segundos
      case 'daily': return 86400; // 1 dia em segundos
      case 'weekly': return 604800; // 7 dias em segundos
      case 'yearly': return 31536000; // 365 dias em segundos
      default: return 86400;
    }
  };

  // Calcular labels para os timeframes
  const getTimeframeLabel = (timeframe: PredictionTimeframe): string => {
    switch (timeframe) {
      case 'hourly': return '1 Hora';
      case 'daily': return '1 Dia';
      case 'weekly': return '1 Semana';
      case 'yearly': return '1 Ano';
      default: return '1 Dia';
    }
  };

  // Função para treinar modelo (APENAS quando solicitado)
  const trainModelFn = useCallback(async () => {
    if (isTrainingRef.current) {
      return;
    }

    if (candles.length < 60) {
      setError(new Error(`Dados insuficientes: ${candles.length}/60 candles necessários`));
      return;
    }

    try {
      isTrainingRef.current = true;
      setIsTraining(true);
      setError(null);

      // Preparar dados
      const trainingData = prepareTrainingData(candles, symbol);

      // Treinar modelo
      const model = await trainModel(trainingData);

      // Avaliar modelo
      const modelMetrics = evaluateModel(model, trainingData);

      // Criar metadata
      const metadata: ModelMetadata = {
        version: '1.0.0',
        trainedAt: Date.now(),
        symbol,
        metrics: modelMetrics,
        scaler: trainingData.scaler,
        sampleSize: candles.length
      };

      // Salvar modelo e metadata
      modelRef.current = model;
      metadataRef.current = metadata;
      setMetrics(modelMetrics);
      setLastTrainedAt(Date.now());
      setIsModelReady(true);
    } catch (err) {
      setError(err as Error);
    } finally {
      setIsTraining(false);
      isTrainingRef.current = false;
    }
  }, [symbol, candles]);

  // Função para fazer previsão (APENAS quando solicitado)
  const makePrediction = useCallback(async (timeframe?: PredictionTimeframe) => {
    if (!modelRef.current || !metadataRef.current) {
      await trainModelFn();
      
      // Verificar se treino foi bem-sucedido
      if (!modelRef.current || !metadataRef.current) {
        setError(new Error('Falha ao treinar modelo'));
        return;
      }
    }

    if (candles.length < 60) {
      setError(new Error('Dados insuficientes para previsão'));
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const targetTimeframe = timeframe || selectedTimeframe;
      const horizon = getPredictionHorizon(targetTimeframe);

      const candlesOverride = candles.slice(-60);
      
      const newPrediction = await predict(modelRef.current, metadataRef.current, candlesOverride);
      
      // Ajustar timestamp da previsão baseado no timeframe
      newPrediction.timestamp = Date.now() + (horizon * 1000);

      setPrediction(newPrediction);
    } catch (err) {
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  }, [candles, selectedTimeframe, trainModelFn, getPredictionHorizon]);

  // Função combinada: treinar e prever
  const trainAndPredict = useCallback(async (timeframe?: PredictionTimeframe) => {
    // Primeiro treinar o modelo
    await trainModelFn();
    
    // Se o modelo foi treinado com sucesso, fazer previsão
    if (modelRef.current && metadataRef.current) {
      await makePrediction(timeframe);
    }
  }, [trainModelFn, makePrediction]);

  return {
    prediction,
    metrics,
    isLoading,
    isTraining,
    error,
    lastTrainedAt,
    selectedTimeframe,
    isModelReady,
    setSelectedTimeframe,
    trainModel: trainModelFn,
    predict: makePrediction,
    trainAndPredict,
    getTimeframeLabel,
    getPredictionHorizon,
  };
}
