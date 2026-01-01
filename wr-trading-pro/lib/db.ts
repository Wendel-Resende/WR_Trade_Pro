import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db

// Helper functions for common operations
export async function getUserPositions(userId: string) {
  return db.position.findMany({
    where: { userId, status: 'OPEN' },
    orderBy: { openedAt: 'desc' },
  })
}

export async function getUserTrades(userId: string, limit = 50) {
  return db.trade.findMany({
    where: { userId },
    orderBy: { executedAt: 'desc' },
    take: limit,
  })
}

// Portfolio statistics
export async function getPortfolioStats(userId?: string) {
  const where = userId ? { userId, status: 'OPEN' } : { status: 'OPEN' };
  
  const positions = await db.position.findMany({ where });
  
  const totalValue = positions.reduce((sum: number, pos: any) => {
    const currentPrice = pos.currentPrice || pos.entryPrice;
    return sum + (pos.quantity * currentPrice);
  }, 0);
  
  const totalPnL = positions.reduce((sum: number, pos: any) => sum + (pos.pnl || 0), 0);
  const totalInvested = positions.reduce((sum: number, pos: any) => sum + (pos.quantity * pos.entryPrice), 0);
  
  const longPositions = positions.filter((pos: any) => pos.type === 'LONG');
  const shortPositions = positions.filter((pos: any) => pos.type === 'SHORT');
  
  return {
    totalValue,
    totalPnL,
    totalInvested,
    returnPercent: totalInvested > 0 ? (totalPnL / totalInvested) * 100 : 0,
    positionCount: positions.length,
    longCount: longPositions.length,
    shortCount: shortPositions.length,
    longValue: longPositions.reduce((sum: number, pos: any) => {
      const currentPrice = pos.currentPrice || pos.entryPrice;
      return sum + (pos.quantity * currentPrice);
    }, 0),
    shortValue: shortPositions.reduce((sum: number, pos: any) => {
      const currentPrice = pos.currentPrice || pos.entryPrice;
      return sum + (pos.quantity * currentPrice);
    }, 0),
  };
}

// Create position
export async function createPosition(
  userId: string,
  symbol: string,
  type: 'LONG' | 'SHORT',
  quantity: number,
  entryPrice: number
) {
  return db.position.create({
    data: {
      userId,
      symbol,
      type,
      quantity,
      entryPrice,
      currentPrice: entryPrice,
      pnl: 0,
      pnlPercent: 0,
      status: 'OPEN',
    },
  });
}

// Update position price
export async function updatePositionPrice(positionId: string, currentPrice: number) {
  const position = await db.position.findUnique({
    where: { id: positionId },
  });
  
  if (!position) {
    throw new Error('Position not found');
  }
  
  const pnl = position.type === 'LONG'
    ? (currentPrice - position.entryPrice) * position.quantity
    : (position.entryPrice - currentPrice) * position.quantity;
  
  const pnlPercent = (pnl / (position.quantity * position.entryPrice)) * 100;
  
  return db.position.update({
    where: { id: positionId },
    data: {
      currentPrice,
      pnl,
      pnlPercent,
    },
  });
}

// Close position
export async function closePosition(positionId: string, closePrice: number) {
  const position = await db.position.findUnique({
    where: { id: positionId },
  });
  
  if (!position) {
    throw new Error('Position not found');
  }
  
  const pnl = position.type === 'LONG'
    ? (closePrice - position.entryPrice) * position.quantity
    : (position.entryPrice - closePrice) * position.quantity;
  
  const pnlPercent = (pnl / (position.quantity * position.entryPrice)) * 100;
  
  return db.position.update({
    where: { id: positionId },
    data: {
      currentPrice: closePrice,
      pnl,
      pnlPercent,
      status: 'CLOSED',
      closedAt: new Date(),
    },
  });
}
