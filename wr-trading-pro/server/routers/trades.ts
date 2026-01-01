import { z } from "zod"
import { createTRPCRouter, publicProcedure } from "../trpc"

// Mock data for development
const mockTrades = [
  { id: "1", assetId: "1", ticker: "BTC", type: "BUY", quantity: 0.5, price: 42000, fees: 10.5, total: 21010.5, executedAt: new Date("2024-01-01T10:30:00") },
  { id: "2", assetId: "2", ticker: "ETH", type: "BUY", quantity: 3, price: 3000, fees: 4.5, total: 9004.5, executedAt: new Date("2024-01-15T14:45:00") },
  { id: "3", assetId: "3", ticker: "AAPL", type: "BUY", quantity: 10, price: 180, fees: 1.8, total: 1801.8, executedAt: new Date("2024-02-01T09:15:00") },
  { id: "4", assetId: "1", ticker: "BTC", type: "SELL", quantity: 0.2, price: 45000, fees: 9, total: 8991, executedAt: new Date("2024-02-15T16:20:00") },
]

const tradeSchema = z.object({
  assetId: z.string(),
  type: z.enum(["BUY", "SELL"]),
  quantity: z.number().positive(),
  price: z.number().positive(),
  fees: z.number().min(0).default(0),
})

export const tradesRouter = createTRPCRouter({
  getTrades: publicProcedure
    .input(z.object({
      filter: z.object({
        assetId: z.string().optional(),
        type: z.enum(["BUY", "SELL"]).optional(),
        startDate: z.date().optional(),
        endDate: z.date().optional(),
        limit: z.number().min(1).max(100).default(50),
      }).optional(),
    }).optional())
    .query(async ({ input }) => {
      const filter = input?.filter
      let trades = [...mockTrades]
      
      if (filter?.assetId) {
        trades = trades.filter(t => t.assetId === filter.assetId)
      }
      
      if (filter?.type) {
        trades = trades.filter(t => t.type === filter.type)
      }
      
      if (filter?.startDate) {
        trades = trades.filter(t => t.executedAt >= filter.startDate!)
      }
      
      if (filter?.endDate) {
        trades = trades.filter(t => t.executedAt <= filter.endDate!)
      }
      
      return trades.slice(0, filter?.limit || 50)
    }),

  createTrade: publicProcedure
    .input(tradeSchema)
    .mutation(async ({ input }) => {
      // Mock implementation - in real app, save to database
      const newTrade = {
        id: `mock-${Date.now()}`,
        ticker: "MOCK", // Would fetch from asset
        ...input,
        total: (input.quantity * input.price) + input.fees,
        executedAt: new Date(),
      }
      
      mockTrades.unshift(newTrade)
      return newTrade
    }),

  getTradeHistory: publicProcedure
    .input(z.object({
      timeframe: z.enum(["24h", "7d", "30d", "90d", "1y", "all"]).default("30d"),
    }).optional())
    .query(async ({ input }) => {
      const timeframe = input?.timeframe || "30d"
      
      // Mock trade history data
      const historyData = {
        "24h": { count: 3, volume: 125000, profitLoss: 1250 },
        "7d": { count: 12, volume: 450000, profitLoss: 3250 },
        "30d": { count: 45, volume: 1850000, profitLoss: 12500 },
        "90d": { count: 120, volume: 5200000, profitLoss: 32500 },
        "1y": { count: 480, volume: 21000000, profitLoss: 125000 },
        "all": { count: 650, volume: 28500000, profitLoss: 185000 },
      }
      
      return {
        timeframe,
        ...historyData[timeframe],
        trades: mockTrades.slice(0, 10), // Recent trades
        metrics: {
          winRate: 65.2,
          avgWin: 1250,
          avgLoss: -850,
          largestWin: 5200,
          largestLoss: -3200,
        },
      }
    }),
})
