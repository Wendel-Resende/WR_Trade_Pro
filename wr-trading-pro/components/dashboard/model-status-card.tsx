'use client';

import { Metrics } from '@/lib/ml/types';

interface ModelStatusCardProps {
  metrics?: Metrics;
  isTraining: boolean;
  lastTrainedAt?: number;
  onRetrain?: () => void;
}

export default function ModelStatusCard({
  metrics,
  isTraining,
  lastTrainedAt,
  onRetrain
}: ModelStatusCardProps) {
  return (
    <div className="neon-card p-6">
      <h3 className="text-xl font-bold text-cyan-400 mb-4">🤖 Status do Modelo</h3>
      
      {isTraining && (
        <div className="flex items-center gap-2 text-yellow-400 mb-4">
          <div className="animate-spin">⚙️</div>
          <span>Treinando modelo...</span>
        </div>
      )}
      
      {metrics && (
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-gray-400">Acurácia:</span>
            <span className={`font-bold ${
              metrics.accuracy > 80 ? 'text-success' :
              metrics.accuracy > 60 ? 'text-yellow-400' :
              'text-danger'
            }`}>
              {metrics.accuracy.toFixed(0)}%
            </span>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-gray-400">R²:</span>
            <span className="font-bold text-cyan-400">
              {metrics.r2.toFixed(2)}
            </span>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-gray-400">MAE:</span>
            <span className="font-bold text-pink-400">
              {metrics.mae.toFixed(4)}
            </span>
          </div>
          
          {lastTrainedAt && (
            <div className="text-xs text-gray-500 mt-4">
              Último treino: {new Date(lastTrainedAt).toLocaleString('pt-BR')}
            </div>
          )}
          
          {onRetrain && (
            <button
              onClick={onRetrain}
              disabled={isTraining}
              className="w-full mt-4 px-4 py-2 bg-primary/20 border border-primary rounded hover:bg-primary/30 transition-colors text-primary font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              🔄 Re-treinar Modelo
            </button>
          )}
        </div>
      )}
    </div>
  );
}
