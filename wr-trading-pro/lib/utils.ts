import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Trading utilities
export function formatCurrency(value: number, currency: string = "USD"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}

export function formatPercentage(value: number): string {
  const sign = value >= 0 ? "+" : ""
  return `${sign}${value.toFixed(2)}%`
}

export function calculatePnL(entryPrice: number, exitPrice: number, quantity: number): {
  pnl: number
  percentage: number
} {
  const pnl = (exitPrice - entryPrice) * quantity
  const percentage = ((exitPrice - entryPrice) / entryPrice) * 100
  return { pnl, percentage }
}

export function formatTimestamp(date: Date): string {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date)
}

// Color utilities for trading
export function getPnLColor(pnl: number): string {
  if (pnl > 0) return "text-trading-profit"
  if (pnl < 0) return "text-trading-loss"
  return "text-gray-500"
}

export function getStatusColor(status: string): string {
  switch (status.toLowerCase()) {
    case "open":
      return "text-cyber-blue"
    case "closed":
      return "text-trading-profit"
    case "cancelled":
      return "text-trading-loss"
    case "pending":
      return "text-cyber-yellow"
    default:
      return "text-gray-500"
  }
}
