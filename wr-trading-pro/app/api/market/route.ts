import { NextRequest, NextResponse } from 'next/server';

// Backend URL - porta correta (8765) - usar HTTP, não WS
const BACKEND_URL = process.env.NEXT_PUBLIC_MT5_WS_URL 
  ? process.env.NEXT_PUBLIC_MT5_WS_URL.replace('ws://', 'http://')
  : 'http://localhost:8765';

// Dados mock para quando o backend não estiver disponível
const MOCK_PRICES: Record<string, { price: number; change: number }> = {
  EURUSD: { price: 1.0850, change: 0.15 },
  GBPUSD: { price: 1.2650, change: -0.08 },
  USDJPY: { price: 149.50, change: 0.22 },
  AUDUSD: { price: 0.6540, change: -0.12 },
  BTCUSD: { price: 43500, change: 2.35 },
  ETHUSD: { price: 2280, change: 1.87 },
};

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const symbolsParam = searchParams.get('symbols');
  
  if (!symbolsParam) {
    return NextResponse.json({}, { status: 400 });
  }
  
  const symbols = symbolsParam.split(',');
  const prices: Record<string, { price: number; change: number }> = {};
  
  try {
    // Para cada símbolo, buscar preços via backend MT5
    for (const symbol of symbols) {
      const trimmedSymbol = symbol.trim();
      
      try {
        const response = await fetch(`${BACKEND_URL}/quotes/${trimmedSymbol}`, {
          signal: AbortSignal.timeout(3000), // Timeout de 3 segundos
        });
        
        if (response.ok) {
          const data = await response.json();
          
          const bid = data.bid || data.price || 0;
          const ask = data.ask || data.price || 0;
          const price = data.price || (bid + ask) / 2;
          
          // Usar changePercent do backend (calculado corretamente)
          const change = data.changePercent || data.change || 0;
          
          prices[trimmedSymbol] = {
            price,
            change
          };
        } else {
          // Se falhar, usar preço mock
          console.warn(`⚠️ Backend retornou status ${response.status} para ${trimmedSymbol}, usando dados mock`);
          prices[trimmedSymbol] = MOCK_PRICES[trimmedSymbol] || { price: 1.0, change: 0 };
        }
      } catch (error) {
        // Silenciar erro ECONNREFUSED - é esperado quando backend não está rodando
        const errorMessage = error instanceof Error ? error.message : String(error);
        if (errorMessage.includes('ECONNREFUSED')) {
          // Não logar nada - é comportamento esperado
        } else if ((error as any)?.cause?.code === 'ECONNREFUSED') {
          // Não logar nada - é comportamento esperado
        } else {
          // Logar apenas outros erros
          console.warn(`⚠️ Erro ao conectar com backend para ${trimmedSymbol}:`, error);
        }
        // Usar dados mock quando backend não estiver disponível
        prices[trimmedSymbol] = MOCK_PRICES[trimmedSymbol] || { price: 1.0, change: 0 };
      }
    }
    
    return NextResponse.json(prices);
  } catch (error) {
    console.error('❌ Erro na API /api/market:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
