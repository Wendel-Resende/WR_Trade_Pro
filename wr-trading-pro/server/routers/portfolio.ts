import { z } from 'zod';
import { createTRPCRouter, publicProcedure } from '../trpc';

export const portfolioRouter = createTRPCRouter({
  // Obter todas as posições abertas
  getPositions: publicProcedure.query(async ({ ctx }) => {
    return ctx.db.position.findMany({
      where: { status: 'OPEN' },
      orderBy: { openedAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
    });
  }),

  // Obter posições por usuário
  getUserPositions: publicProcedure
    .input(z.object({ userId: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.db.position.findMany({
        where: { 
          userId: input.userId,
          status: 'OPEN',
        },
        orderBy: { openedAt: 'desc' },
      });
    }),

  // Obter valor total do portfólio
  getTotalValue: publicProcedure.query(async ({ ctx }) => {
    const positions = await ctx.db.position.findMany({
      where: { status: 'OPEN' },
    });
    
    const total = positions.reduce((sum: number, pos: any) => {
      const currentPrice = pos.currentPrice || pos.entryPrice;
      return sum + (pos.quantity * currentPrice);
    }, 0);
    
    return total;
  }),

  // Obter P&L diário
  getDailyPnL: publicProcedure.query(async ({ ctx }) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const positions = await ctx.db.position.findMany({
      where: {
        openedAt: { gte: today },
        status: 'OPEN',
      },
    });
    
    const pnl = positions.reduce((sum: number, pos: any) => sum + (pos.pnl || 0), 0);
    return pnl;
  }),

  // Obter P&L total
  getTotalPnL: publicProcedure.query(async ({ ctx }) => {
    const positions = await ctx.db.position.findMany({
      where: { status: 'OPEN' },
    });
    
    const pnl = positions.reduce((sum: number, pos: any) => sum + (pos.pnl || 0), 0);
    return pnl;
  }),

  // Obter estatísticas do portfólio
  getPortfolioStats: publicProcedure.query(async ({ ctx }) => {
    const positions = await ctx.db.position.findMany({
      where: { status: 'OPEN' },
    });
    
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
  }),

  // Criar nova posição
  createPosition: publicProcedure
    .input(z.object({
      userId: z.string(),
      symbol: z.string(),
      type: z.enum(['LONG', 'SHORT']),
      quantity: z.number(),
      entryPrice: z.number(),
    }))
    .mutation(async ({ ctx, input }) => {
      const position = await ctx.db.position.create({
        data: {
          userId: input.userId,
          symbol: input.symbol,
          type: input.type,
          quantity: input.quantity,
          entryPrice: input.entryPrice,
          currentPrice: input.entryPrice,
          pnl: 0,
          pnlPercent: 0,
          status: 'OPEN',
        },
      });
      
      return position;
    }),

  // Atualizar preço atual de uma posição
  updatePositionPrice: publicProcedure
    .input(z.object({
      positionId: z.string(),
      currentPrice: z.number(),
    }))
    .mutation(async ({ ctx, input }) => {
      const position = await ctx.db.position.findUnique({
        where: { id: input.positionId },
      });
      
      if (!position) {
        throw new Error('Position not found');
      }
      
      const pnl = position.type === 'LONG'
        ? (input.currentPrice - position.entryPrice) * position.quantity
        : (position.entryPrice - input.currentPrice) * position.quantity;
      
      const pnlPercent = (pnl / (position.quantity * position.entryPrice)) * 100;
      
      const updatedPosition = await ctx.db.position.update({
        where: { id: input.positionId },
        data: {
          currentPrice: input.currentPrice,
          pnl,
          pnlPercent,
        },
      });
      
      return updatedPosition;
    }),

  // Fechar posição
  closePosition: publicProcedure
    .input(z.object({
      positionId: z.string(),
      closePrice: z.number(),
    }))
    .mutation(async ({ ctx, input }) => {
      const position = await ctx.db.position.findUnique({
        where: { id: input.positionId },
      });
      
      if (!position) {
        throw new Error('Position not found');
      }
      
      const pnl = position.type === 'LONG'
        ? (input.closePrice - position.entryPrice) * position.quantity
        : (position.entryPrice - input.closePrice) * position.quantity;
      
      const pnlPercent = (pnl / (position.quantity * position.entryPrice)) * 100;
      
      const closedPosition = await ctx.db.position.update({
        where: { id: input.positionId },
        data: {
          currentPrice: input.closePrice,
          pnl,
          pnlPercent,
          status: 'CLOSED',
          closedAt: new Date(),
        },
      });
      
      return closedPosition;
    }),

  // Obter histórico de posições fechadas
  getClosedPositions: publicProcedure
    .input(z.object({ 
      userId: z.string().optional(),
      limit: z.number().optional().default(50),
    }))
    .query(async ({ ctx, input }) => {
      const where = input.userId 
        ? { userId: input.userId, status: 'CLOSED' }
        : { status: 'CLOSED' };
      
      return ctx.db.position.findMany({
        where,
        orderBy: { closedAt: 'desc' },
        take: input.limit,
      });
    }),
});
