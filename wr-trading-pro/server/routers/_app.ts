import { createTRPCRouter } from "../trpc"
import { marketRouter } from "./market"
import { portfolioRouter } from "./portfolio"
import { tradesRouter } from "./trades"
import { alertsRouter } from "./alerts"

export const appRouter = createTRPCRouter({
  market: marketRouter,
  portfolio: portfolioRouter,
  trades: tradesRouter,
  alerts: alertsRouter,
})

export type AppRouter = typeof appRouter
