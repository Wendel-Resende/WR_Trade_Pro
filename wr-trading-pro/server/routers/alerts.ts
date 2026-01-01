import { z } from "zod"
import { createTRPCRouter, publicProcedure } from "../trpc"

// Mock data for development
const mockAlerts = [
  { id: "1", assetId: "1", ticker: "BTC", condition: "PRICE_ABOVE", value: 50000, active: true, triggered: false, createdAt: new Date("2024-01-01") },
  { id: "2", assetId: "2", ticker: "ETH", condition: "PRICE_BELOW", value: 3000, active: true, triggered: true, triggeredAt: new Date("2024-01-15"), createdAt: new Date("2024-01-10") },
  { id: "3", assetId: "3", ticker: "AAPL", condition: "PERCENT_CHANGE_UP", value: 5, active: false, triggered: false, createdAt: new Date("2024-02-01") },
]

const alertSchema = z.object({
  assetId: z.string(),
  condition: z.enum(["PRICE_ABOVE", "PRICE_BELOW", "PERCENT_CHANGE_UP", "PERCENT_CHANGE_DOWN", "VOLUME_SPIKE"]),
  value: z.number(),
  active: z.boolean().default(true),
})

const updateAlertSchema = alertSchema.partial().extend({
  id: z.string(),
})

export const alertsRouter = createTRPCRouter({
  getAlerts: publicProcedure
    .input(z.object({
      activeOnly: z.boolean().default(true),
    }).optional())
    .query(async ({ input }) => {
      const activeOnly = input?.activeOnly ?? true
      let alerts = [...mockAlerts]
      
      if (activeOnly) {
        alerts = alerts.filter(a => a.active)
      }
      
      return alerts
    }),

  createAlert: publicProcedure
    .input(alertSchema)
    .mutation(async ({ input }) => {
      // Mock implementation - in real app, save to database
      const newAlert = {
        id: `alert-${Date.now()}`,
        ticker: "MOCK", // Would fetch from asset
        triggered: false,
        triggeredAt: undefined,
        createdAt: new Date(),
        ...input,
      }
      
      mockAlerts.unshift(newAlert)
      return newAlert
    }),

  updateAlert: publicProcedure
    .input(updateAlertSchema)
    .mutation(async ({ input }) => {
      const { id, ...updateData } = input
      const alertIndex = mockAlerts.findIndex(a => a.id === id)
      
      if (alertIndex === -1) {
        throw new Error(`Alert ${id} not found`)
      }
      
      // Mock update
      mockAlerts[alertIndex] = {
        ...mockAlerts[alertIndex],
        ...updateData,
      }
      
      return mockAlerts[alertIndex]
    }),

  deleteAlert: publicProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      const alertIndex = mockAlerts.findIndex(a => a.id === input.id)
      
      if (alertIndex === -1) {
        throw new Error(`Alert ${input.id} not found`)
      }
      
      const deletedAlert = mockAlerts[alertIndex]
      mockAlerts.splice(alertIndex, 1)
      
      return deletedAlert
    }),
})
