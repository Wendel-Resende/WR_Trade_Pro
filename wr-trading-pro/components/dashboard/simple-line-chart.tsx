'use client';

import { Candle } from '@/lib/ml/types';

interface SimpleLineChartProps {
  data: Candle[];
  width?: number;
  height?: number;
  prediction?: {
    price: number;
    range: {
      min: number;
      max: number;
    };
  };
}

export default function SimpleLineChart({
  data,
  width = 800,
  height = 400,
  prediction
}: SimpleLineChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500">
        Aguardando dados...
      </div>
    );
  }

  const padding = 50;
  const prices = data.map(c => c.close);
  
  // Incluir prediction no range
  let minPrice = Math.min(...prices);
  let maxPrice = Math.max(...prices);
  
  if (prediction) {
    minPrice = Math.min(minPrice, prediction.range.min);
    maxPrice = Math.max(maxPrice, prediction.range.max, prediction.price);
  }
  
  const priceRange = maxPrice - minPrice || 1; // Evitar divisão por zero

  const priceToY = (price: number) => {
    return height - padding - ((price - minPrice) / priceRange) * (height - 2 * padding);
  };

  const indexToX = (index: number) => {
    if (data.length <= 1) return width / 2;
    return padding + (index / (data.length - 1)) * (width - 2 * padding);
  };

  // Criar path para linha histórica
  const pathData = data
    .map((candle, i) => {
      const x = indexToX(i);
      const y = priceToY(candle.close);
      return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
    })
    .join(' ');

  // Path para previsão
  let predictionPath = '';
  let predictionLine = '';
  if (prediction && data.length > 0) {
    const lastX = indexToX(data.length - 1);
    const lastY = priceToY(data[data.length - 1].close);
    const predX = width - padding;
    const predY = priceToY(prediction.price);
    
    predictionLine = `M ${lastX} ${lastY} L ${predX} ${predY}`;
    
    // Área de confiança
    const minY = priceToY(prediction.range.min);
    const maxY = priceToY(prediction.range.max);
    predictionPath = `
      M ${lastX} ${minY}
      L ${predX} ${minY}
      L ${predX} ${maxY}
      L ${lastX} ${maxY}
      Z
    `;
  }

  // Grid horizontal
  const gridLines = [0, 0.25, 0.5, 0.75, 1].map(ratio => {
    const y = padding + ratio * (height - 2 * padding);
    const price = maxPrice - ratio * priceRange;
    return (
      <g key={`grid-${ratio}`}>
        <line
          x1={padding}
          y1={y}
          x2={width - padding}
          y2={y}
          stroke="#1A1F3A"
          strokeWidth="1"
          strokeDasharray="4 4"
        />
        <text
          x={padding - 10}
          y={y + 5}
          fill="#00F5FF"
          fontSize="11"
          textAnchor="end"
          fontFamily="monospace"
        >
          {price.toFixed(4)}
        </text>
      </g>
    );
  });

  // Pontos de dados
  const dataPoints = data.map((candle, i) => {
    // Mostrar apenas alguns pontos se houver muitos
    if (data.length > 50 && i % Math.floor(data.length / 20) !== 0) return null;
    
    return (
      <circle
        key={i}
        cx={indexToX(i)}
        cy={priceToY(candle.close)}
        r={data.length > 50 ? 2 : 3}
        fill="#00F5FF"
        opacity={0.7}
      />
    );
  });

  return (
    <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} className="bg-surface/50 rounded">
      {/* Grid */}
      {gridLines}

      {/* Área de confiança (se houver previsão) */}
      {predictionPath && (
        <path
          d={predictionPath}
          fill="rgba(255, 0, 110, 0.1)"
          stroke="rgba(255, 0, 110, 0.3)"
          strokeWidth="1"
        />
      )}

      {/* Linha de preços históricos */}
      <path
        d={pathData}
        fill="none"
        stroke="#00F5FF"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Linha de previsão */}
      {predictionLine && (
        <path
          d={predictionLine}
          fill="none"
          stroke="#FF006E"
          strokeWidth="2"
          strokeDasharray="5 5"
          strokeLinecap="round"
        />
      )}

      {/* Pontos */}
      {dataPoints}

      {/* Labels de eixo X */}
      {data.length > 0 && (
        <>
          <text
            x={padding}
            y={height - 10}
            fill="#00F5FF"
            fontSize="10"
            textAnchor="middle"
          >
            {new Date(data[0].time).toLocaleTimeString()}
          </text>
          <text
            x={width - padding}
            y={height - 10}
            fill="#00F5FF"
            fontSize="10"
            textAnchor="middle"
          >
            {new Date(data[data.length - 1].time).toLocaleTimeString()}
          </text>
        </>
      )}

      {/* Previsão label */}
      {prediction && (
        <text
          x={width - padding - 50}
          y={padding + 20}
          fill="#FF006E"
          fontSize="12"
          textAnchor="end"
          fontWeight="bold"
        >
          Previsão: ${prediction.price.toFixed(4)}
        </text>
      )}

      {/* Info */}
      <text x={width / 2} y={height - 5} fill="#00F5FF" fontSize="11" textAnchor="middle" opacity={0.5}>
        {data.length} candles
      </text>
    </svg>
  );
}
