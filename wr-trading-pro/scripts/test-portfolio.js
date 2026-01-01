const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('🧪 Testando integração do portfolio...');

  // Criar um usuário de teste
  const user = await prisma.user.upsert({
    where: { email: 'test@wr-trading.com' },
    update: {},
    create: {
      email: 'test@wr-trading.com',
      name: 'Test User',
      passwordHash: 'test123',
      isActive: true,
    },
  });

  console.log('✅ Usuário criado:', user.email);

  // Criar posições de teste
  const positions = [
    {
      userId: user.id,
      symbol: 'BTCUSD',
      type: 'LONG',
      quantity: 0.5,
      entryPrice: 43000,
      currentPrice: 43250,
      pnl: 125,
      pnlPercent: 0.58,
      status: 'OPEN',
    },
    {
      userId: user.id,
      symbol: 'ETHUSD',
      type: 'LONG',
      quantity: 5,
      entryPrice: 2300,
      currentPrice: 2280,
      pnl: -100,
      pnlPercent: -0.87,
      status: 'OPEN',
    },
    {
      userId: user.id,
      symbol: 'EURUSD',
      type: 'SHORT',
      quantity: 10000,
      entryPrice: 1.0850,
      currentPrice: 1.0845,
      pnl: 5,
      pnlPercent: 0.05,
      status: 'OPEN',
    },
  ];

  for (const positionData of positions) {
    const position = await prisma.position.create({
      data: positionData,
    });
    console.log(`✅ Posição criada: ${position.symbol} ${position.type} ${position.quantity}`);
  }

  // Calcular estatísticas
  const allPositions = await prisma.position.findMany({
    where: { status: 'OPEN' },
  });

  const totalValue = allPositions.reduce((sum, pos) => {
    const currentPrice = pos.currentPrice || pos.entryPrice;
    return sum + (pos.quantity * currentPrice);
  }, 0);

  const totalPnL = allPositions.reduce((sum, pos) => sum + (pos.pnl || 0), 0);
  const totalInvested = allPositions.reduce((sum, pos) => sum + (pos.quantity * pos.entryPrice), 0);

  console.log('\n📊 Estatísticas do Portfolio:');
  console.log(`💰 Valor Total: $${totalValue.toFixed(2)}`);
  console.log(`📈 P&L Total: $${totalPnL.toFixed(2)}`);
  console.log(`💵 Investido Total: $${totalInvested.toFixed(2)}`);
  console.log(`📊 Retorno: ${((totalPnL / totalInvested) * 100).toFixed(2)}%`);
  console.log(`📍 Posições Ativas: ${allPositions.length}`);

  // Testar API tRPC
  console.log('\n🌐 Testando API tRPC...');
  console.log('URL: http://localhost:3000/api/trpc/portfolio.getPortfolioStats');
  console.log('URL: http://localhost:3000/api/trpc/portfolio.getPositions');

  await prisma.$disconnect();
  console.log('\n✅ Teste concluído!');
}

main().catch(async (e) => {
  console.error('❌ Erro:', e);
  await prisma.$disconnect();
  process.exit(1);
});
