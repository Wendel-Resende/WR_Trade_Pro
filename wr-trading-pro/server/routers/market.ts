import { z } from "zod"
import { createTRPCRouter, publicProcedure } from "../trpc"

// Mock data for development
const mockAssets = [
  { id: "1", ticker: "BTC", name: "Bitcoin", type: "CRYPTO", currentPrice: 45000, change24h: 2.5 },
  { id: "2", ticker: "ETH", name: "Ethereum", type: "CRYPTO", currentPrice: 3200, change24h: 1.8 },
  { id: "3", ticker: "AAPL", name: "Apple Inc.", type: "STOCK", currentPrice: 185, change24h: -0.5 },
  { id: "4", ticker: "TSLA", name: "Tesla Inc.", type: "STOCK", currentPrice: 245, change24h: 3.2 },
  { id: "5", ticker: "EURUSD", name: "Euro/US Dollar", type: "FX", currentPrice: 1.085, change24h: 0.1 },
]

const mockHistoricalData = [
  { timestamp: new Date("2024-01-01"), open: 44000, high: 45500, low: 43800, close: 45000, volume: 1000000 },
  { timestamp: new Date("2024-01-02"), open: 45200, high: 46000, low: 44800, close: 45500, volume: 1200000 },
  { timestamp: new Date("2024-01-03"), open: 45600, high: 46500, low: 45200, close: 46000, volume: 1100000 },
]

const mockOrderBook = {
  bids: [
    { price: 44900, amount: 1.5 },
    { price: 44850, amount: 2.3 },
    { price: 44800, amount: 1.8 },
  ],
  asks: [
    { price: 45100, amount: 2.1 },
    { price: 45150, amount: 1.7 },
    { price: 45200, amount: 3.2 },
  ],
}

export const marketRouter = createTRPCRouter({
  getAsset: publicProcedure
    .input(z.object({ ticker: z.string() }))
    .query(async ({ input, ctx }) => {
      // Mock implementation
      const asset = mockAssets.find(a => a.ticker === input.ticker)
      if (!asset) {
        throw new Error(`Asset ${input.ticker} not found`)
      }
      return asset
    }),

  getAssets: publicProcedure
    .input(z.object({
      filter: z.object({
        type: z.enum(["STOCK", "CRYPTO", "FX", "FUTURE", "OPTION", "INDEX"]).optional(),
        search: z.string().optional(),
        limit: z.number().min(1).max(100).default(20),
      }).optional(),
    }).optional())
    .query(async ({ input }) => {
      const filter = input?.filter
      let assets = [...mockAssets]
      
      if (filter?.type) {
        assets = assets.filter(a => a.type === filter.type)
      }
      
      if (filter?.search) {
        const searchLower = filter.search.toLowerCase()
        assets = assets.filter(a => 
          a.ticker.toLowerCase().includes(searchLower) || 
          a.name.toLowerCase().includes(searchLower)
        )
      }
      
      return assets.slice(0, filter?.limit || 20)
    }),

  getCurrentPrice: publicProcedure
    .input(z.object({ ticker: z.string() }))
    .query(async ({ input }) => {
      const asset = mockAssets.find(a => a.ticker === input.ticker)
      if (!asset) {
        throw new Error(`Asset ${input.ticker} not found`)
      }
      return {
        ticker: asset.ticker,
        price: asset.currentPrice,
        change24h: asset.change24h,
        timestamp: new Date(),
      }
    }),

  getHistoricalData: publicProcedure
    .input(z.object({
      ticker: z.string(),
      timeframe: z.enum(["1d", "1w", "1m", "3m", "1y"]),
      limit: z.number().min(1).max(1000).default(100),
    }))
    .query(async ({ input }) => {
      // Mock implementation - in real app, fetch from database or API
      return {
        ticker: input.ticker,
        timeframe: input.timeframe,
        data: mockHistoricalData.slice(0, input.limit),
      }
    }),

  getOrderBook: publicProcedure
    .input(z.object({ ticker: z.string() }))
    .query(async ({ input }) => {
      // Mock implementation
      return {
        ticker: input.ticker,
        timestamp: new Date(),
        ...mockOrderBook,
      }
    }),
})
