/**
 * Exemplo de uso do sistema de recomendações
 */

import { analyzeAsset, analyzeMultipleAssets, MarketData, DEFAULT_CONFIG } from './recommendations';

/**
 * Exemplo 1: Análise de um único ativo
 */
function exemploAnaliseIndividual() {
  console.log('=== EXEMPLO 1: ANÁLISE INDIVIDUAL ===\n');

  // Dados de exemplo para Apple Inc.
  const appleData: MarketData = {
    symbol: 'AAPL',
    prices: Array.from({ length: 250 }, (_, i) => 
      150 + Math.sin(i * 0.1) * 20 + Math.random() * 5
    ),
    currentPrice: 155.75,
    timestamp: new Date()
  };

  console.log(`Analisando ${appleData.symbol}...`);
  console.log(`- Preço atual: $${appleData.currentPrice.toFixed(2)}`);
  console.log(`- Histórico: ${appleData.prices.length} períodos\n`);

  const recommendation = analyzeAsset(appleData);

  console.log('📊 RECOMENDAÇÃO GERADA:');
  console.log(`- Sinal: ${recommendation.signal}`);
  console.log(`- Força: ${recommendation.strength}%`);
  console.log(`- Confiança: ${recommendation.confidence}%`);
  console.log(`- Pontuação: ${recommendation.score}`);

  console.log('\n📈 INDICADORES:');
  console.log(`- RSI: ${recommendation.indicators.rsi.value.toFixed(2)} (${recommendation.indicators.rsi.signal})`);
  console.log(`- MACD: ${recommendation.indicators.macd.value.toFixed(4)} (${recommendation.indicators.macd.signal})`);
  console.log(`- Bollinger: ${recommendation.indicators.bollinger.value.toFixed(1)}% (${recommendation.indicators.bollinger.signal})`);
  console.log(`- Tendência: ${recommendation.indicators.trend.value} (${recommendation.indicators.trend.signal})`);

  console.log('\n📝 RAZÕES:');
  recommendation.reasons.forEach((reason, i) => {
    console.log(`  ${i + 1}. ${reason}`);
  });

  if (recommendation.targetPrice && recommendation.stopLoss) {
    console.log('\n🎯 NÍVEIS DE PREÇO:');
    console.log(`- Target Price: $${recommendation.targetPrice.toFixed(2)}`);
    console.log(`- Stop Loss: $${recommendation.stopLoss.toFixed(2)}`);
    console.log(`- Risco/Retorno: ${((recommendation.targetPrice - appleData.currentPrice) / (appleData.currentPrice - recommendation.stopLoss)).toFixed(2)}:1`);
  }

  console.log(`\n⏰ Análise gerada em: ${recommendation.timestamp.toLocaleString('pt-BR')}`);
}

/**
 * Exemplo 2: Análise de múltiplos ativos
 */
function exemploAnaliseMultipla() {
  console.log('\n\n=== EXEMPLO 2: ANÁLISE MÚLTIPLA ===\n');

  // Criar dados para múltiplos ativos
  const assets: MarketData[] = [
    {
      symbol: 'AAPL',
      prices: Array.from({ length: 250 }, (_, i) => 150 + Math.sin(i * 0.1) * 20),
      currentPrice: 155.75
    },
    {
      symbol: 'GOOGL',
      prices: Array.from({ length: 250 }, (_, i) => 2800 + Math.sin(i * 0.15) * 100),
      currentPrice: 2850.50
    },
    {
      symbol: 'TSLA',
      prices: Array.from({ length: 250 }, (_, i) => 200 + Math.sin(i * 0.2) * 50),
      currentPrice: 210.25
    },
    {
      symbol: 'MSFT',
      prices: Array.from({ length: 250 }, (_, i) => 350 + Math.sin(i * 0.12) * 30),
      currentPrice: 345.80
    }
  ];

  console.log(`Analisando ${assets.length} ativos...\n`);

  const recommendations = analyzeMultipleAssets(assets);

  // Separar por sinal
  const buyRecommendations = recommendations.filter(r => r.signal === 'BUY');
  const sellRecommendations = recommendations.filter(r => r.signal === 'SELL');
  const holdRecommendations = recommendations.filter(r => r.signal === 'HOLD');

  console.log('📊 RESUMO DAS RECOMENDAÇÕES:');
  console.log(`- COMPRAR (BUY): ${buyRecommendations.length} ativos`);
  console.log(`- VENDER (SELL): ${sellRecommendations.length} ativos`);
  console.log(`- MANTER (HOLD): ${holdRecommendations.length} ativos`);

  console.log('\n🏆 TOP RECOMENDAÇÕES DE COMPRA:');
  buyRecommendations.slice(0, 3).forEach((rec, i) => {
    console.log(`  ${i + 1}. ${rec.symbol} - Força: ${rec.strength}%, Confiança: ${rec.confidence}%`);
  });

  console.log('\n📉 RECOMENDAÇÕES DE VENDA:');
  sellRecommendations.slice(0, 3).forEach((rec, i) => {
    console.log(`  ${i + 1}. ${rec.symbol} - Força: ${rec.strength}%, Confiança: ${rec.confidence}%`);
  });

  // Mostrar detalhes da melhor recomendação
  if (recommendations.length > 0) {
    const bestRecommendation = recommendations[0];
    console.log(`\n⭐ MELHOR RECOMENDAÇÃO: ${bestRecommendation.symbol}`);
    console.log(`   Sinal: ${bestRecommendation.signal}`);
    console.log(`   Força: ${bestRecommendation.strength}%`);
    console.log(`   Razão principal: ${bestRecommendation.reasons[0]}`);
  }
}

/**
 * Exemplo 3: Configurações personalizadas
 */
function exemploConfiguracoesPersonalizadas() {
  console.log('\n\n=== EXEMPLO 3: CONFIGURAÇÕES PERSONALIZADAS ===\n');

  const customConfig = {
    ...DEFAULT_CONFIG,
    rsiOversold: 25,  // Mais conservador
    rsiOverbought: 75, // Mais conservador
    smaShortPeriod: 10, // SMA mais curta
    smaMediumPeriod: 30 // SMA mais curta
  };

  const data: MarketData = {
    symbol: 'BTC-USD',
    prices: Array.from({ length: 250 }, (_, i) => 
      50000 + Math.sin(i * 0.2) * 10000 + Math.random() * 2000
    ),
    currentPrice: 52000
  };

  console.log('Configurações personalizadas:');
  console.log(`- RSI oversold: ${customConfig.rsiOversold}`);
  console.log(`- RSI overbought: ${customConfig.rsiOverbought}`);
  console.log(`- SMA curta: ${customConfig.smaShortPeriod} períodos`);
  console.log(`- SMA média: ${customConfig.smaMediumPeriod} períodos\n`);

  const recommendation = analyzeAsset(data, customConfig);

  console.log(`Recomendação para ${data.symbol}:`);
  console.log(`- Sinal: ${recommendation.signal}`);
  console.log(`- Força: ${recommendation.strength}%`);
  console.log(`- Confiança: ${recommendation.confidence}%`);
}

/**
 * Exemplo 4: Simulação de estratégia
 */
function exemploEstrategia() {
  console.log('\n\n=== EXEMPLO 4: SIMULAÇÃO DE ESTRATÉGIA ===\n');

  // Simular 30 dias de trading
  const initialCapital = 10000;
  let capital = initialCapital;
  let position = 0;
  let trades = 0;
  let profitableTrades = 0;

  console.log('Simulando estratégia baseada em recomendações...');
  console.log(`Capital inicial: $${initialCapital.toFixed(2)}\n`);

  for (let day = 0; day < 30; day++) {
    // Gerar dados simulados para o dia
    const price = 100 + Math.sin(day * 0.3) * 20 + Math.random() * 10;
    const prices = Array.from({ length: 250 }, (_, i) => 
      100 + Math.sin((day + i) * 0.1) * 15 + Math.random() * 5
    );

    const data: MarketData = {
      symbol: 'SIM',
      prices,
      currentPrice: price
    };

    const recommendation = analyzeAsset(data);

    // Executar estratégia simples
    if (recommendation.signal === 'BUY' && position === 0) {
      // Comprar
      position = capital / price;
      capital = 0;
      trades++;
      console.log(`Dia ${day + 1}: COMPRAR a $${price.toFixed(2)}`);
    } else if (recommendation.signal === 'SELL' && position > 0) {
      // Vender
      const saleValue = position * price;
      const profit = saleValue - (initialCapital / trades);
      capital = saleValue;
      position = 0;
      
      if (profit > 0) profitableTrades++;
      console.log(`Dia ${day + 1}: VENDER a $${price.toFixed(2)} (${profit > 0 ? 'Lucro' : 'Prejuízo'})`);
    }
  }

  // Liquidar posição final
  if (position > 0) {
    const finalPrice = 100 + Math.sin(30 * 0.3) * 20 + Math.random() * 10;
    capital = position * finalPrice;
    console.log(`Dia 30: LIQUIDAR posição a $${finalPrice.toFixed(2)}`);
  }

  const totalReturn = ((capital - initialCapital) / initialCapital) * 100;
  const winRate = trades > 0 ? (profitableTrades / trades) * 100 : 0;

  console.log('\n📈 RESULTADO DA ESTRATÉGIA:');
  console.log(`- Capital final: $${capital.toFixed(2)}`);
  console.log(`- Retorno total: ${totalReturn.toFixed(2)}%`);
  console.log(`- Total trades: ${trades}`);
  console.log(`- Taxa de acerto: ${winRate.toFixed(1)}%`);
}

/**
 * Executar todos os exemplos
 */
function executarExemplos() {
  console.log('🚀 SISTEMA DE RECOMENDAÇÕES DE TRADING 🚀\n');
  console.log('Este sistema analisa indicadores técnicos e gera recomendações automatizadas.\n');

  exemploAnaliseIndividual();
  exemploAnaliseMultipla();
  exemploConfiguracoesPersonalizadas();
  exemploEstrategia();

  console.log('\n✅ Todos os exemplos executados com sucesso!');
  console.log('\n💡 CARACTERÍSTICAS DO SISTEMA:');
  console.log('- Análise baseada em 4 indicadores técnicos (RSI, MACD, Bollinger Bands, Tendência)');
  console.log('- Sistema de pontuação para determinar sinais BUY/SELL/HOLD');
  console.log('- Cálculo automático de target price e stop loss');
  console.log('- Configurações personalizáveis');
  console.log('- Suporte a análise de múltiplos ativos');
  console.log('- 100% cobertura de testes');
}

// Executar se este arquivo for executado diretamente
if (require.main === module) {
  executarExemplos();
}

export {
  exemploAnaliseIndividual,
  exemploAnaliseMultipla,
  exemploConfiguracoesPersonalizadas,
  exemploEstrategia,
  executarExemplos
};
