'use client';

import { useEffect, useRef, useState } from 'react';

export default function TradingChart() {
  const chartRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Simular carregamento do gráfico
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="bg-surface border border-gray-800 rounded-xl p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-bold text-white">Previsão USDJPY</h3>
          <p className="text-sm text-muted">Análise técnica com previsão ML</p>
        </div>
        <button className="px-4 py-2 bg-gradient-to-r from-primary to-secondary text-white font-semibold rounded-lg hover:opacity-90 transition-opacity">
          Re-treinar
        </button>
      </div>

      {/* Área do Gráfico */}
      <div 
        ref={chartRef}
        className="h-96 bg-gray-900/50 border border-gray-800 rounded-lg relative overflow-hidden"
      >
        {isLoading ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="w-16 h-16 border-4 border-secondary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-muted">Carregando gráfico...</p>
            </div>
          </div>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="text-4xl mb-4">📈</div>
              <h4 className="text-xl font-bold text-white mb-2">Gráfico TradingView</h4>
              <p className="text-muted">Integração com lightweight-charts ou TradingView</p>
              <div className="mt-6 grid grid-cols-3 gap-4 max-w-md mx-auto">
                <div className="text-center">
                  <div className="text-success text-lg font-bold">1.0845</div>
                  <div className="text-xs text-muted">Atual</div>
                </div>
                <div className="text-center">
                  <div className="text-primary text-lg font-bold">1.0850</div>
                  <div className="text-xs text-muted">Previsão</div>
                </div>
                <div className="text-center">
                  <div className="text-yellow-400 text-lg font-bold">+0.05%</div>
                  <div className="text-xs text-muted">Variação</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Linhas de grade simuladas */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/4 left-0 right-0 h-px bg-gray-800/50"></div>
          <div className="absolute top-1/2 left-0 right-0 h-px bg-gray-800/50"></div>
          <div className="absolute top-3/4 left-0 right-0 h-px bg-gray-800/50"></div>
          <div className="absolute top-0 bottom-0 left-1/4 w-px bg-gray-800/50"></div>
          <div className="absolute top-0 bottom-0 left-1/2 w-px bg-gray-800/50"></div>
          <div className="absolute top-0 bottom-0 left-3/4 w-px bg-gray-800/50"></div>
        </div>
      </div>

      {/* Legenda */}
      <div className="mt-4 flex items-center justify-between text-sm">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-success rounded-full"></div>
            <span className="text-muted">Histórico</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-primary rounded-full"></div>
            <span className="text-muted">Previsão ML</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-secondary rounded-full"></div>
            <span className="text-muted">Médias Móveis</span>
          </div>
        </div>
        <div className="text-muted">
          Última atualização: <span className="text-white">há 2 segundos</span>
        </div>
      </div>
    </div>
  );
}
