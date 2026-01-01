"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { TrendingUp, TrendingDown, MoreVertical } from "lucide-react"

interface Position {
  id: string
  asset: string
  symbol: string
  quantity: number
  avgPrice: number
  currentPrice: number
  pnl: number
  pnlPercent: number
  value: number
}

export function PositionsTable() {
  const positions: Position[] = [
    { id: "1", asset: "Bitcoin", symbol: "BTC", quantity: 0.5, avgPrice: 42000, currentPrice: 45023.50, pnl: 1511.75, pnlPercent: 7.20, value: 22511.75 },
    { id: "2", asset: "Ethereum", symbol: "ETH", quantity: 3.2, avgPrice: 3100, currentPrice: 3201.25, pnl: 324.00, pnlPercent: 3.27, value: 10244.00 },
    { id: "3", asset: "Apple Inc.", symbol: "AAPL", quantity: 10, avgPrice: 180, currentPrice: 185.42, pnl: 54.20, pnlPercent: 3.01, value: 1854.20 },
    { id: "4", asset: "Tesla Inc.", symbol: "TSLA", quantity: 5, avgPrice: 240, currentPrice: 245.80, pnl: 29.00, pnlPercent: 2.42, value: 1229.00 },
    { id: "5", asset: "Microsoft", symbol: "MSFT", quantity: 8, avgPrice: 410, currentPrice: 415.75, pnl: 46.00, pnlPercent: 1.40, value: 3326.00 },
  ]

  const totalPnl = positions.reduce((sum, pos) => sum + pos.pnl, 0)
  const totalValue = positions.reduce((sum, pos) => sum + pos.value, 0)

  return (
    <Card className="bg-surface border-surface h-full">
      <div className="p-4 border-b border-surface">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-orbitron text-lg font-bold tracking-wider">
              Posições Abertas
            </h3>
            <p className="text-sm text-gray-400">
              Total: <span className="font-bold">${totalValue.toLocaleString("en-US", { minimumFractionDigits: 2 })}</span>
              <span className={cn("ml-4", totalPnl >= 0 ? "text-success" : "text-danger")}>
                P&L: {totalPnl >= 0 ? "+" : ""}${totalPnl.toLocaleString("en-US", { minimumFractionDigits: 2 })}
              </span>
            </p>
          </div>
          <Button variant="outline" size="sm">
            Fechar Todas
          </Button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-surface">
              <th className="text-left p-4 text-sm text-gray-400 font-jetbrains">Ativo</th>
              <th className="text-right p-4 text-sm text-gray-400 font-jetbrains">Quantidade</th>
              <th className="text-right p-4 text-sm text-gray-400 font-jetbrains">Preço Médio</th>
              <th className="text-right p-4 text-sm text-gray-400 font-jetbrains">Preço Atual</th>
              <th className="text-right p-4 text-sm text-gray-400 font-jetbrains">Valor</th>
              <th className="text-right p-4 text-sm text-gray-400 font-jetbrains">P&L</th>
              <th className="text-right p-4 text-sm text-gray-400 font-jetbrains">Ações</th>
            </tr>
          </thead>
          <tbody>
            {positions.map((position) => (
              <tr key={position.id} className="border-b border-surface/50 hover:bg-surface/30">
                <td className="p-4">
                  <div className="flex items-center">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-primary to-secondary flex items-center justify-center mr-3">
                      <span className="font-bold text-xs text-white">{position.symbol.charAt(0)}</span>
                    </div>
                    <div>
                      <div className="font-medium">{position.asset}</div>
                      <div className="text-sm text-gray-400">{position.symbol}</div>
                    </div>
                  </div>
                </td>
                <td className="text-right p-4 font-medium">
                  {position.quantity.toLocaleString("en-US", { minimumFractionDigits: 4 })}
                </td>
                <td className="text-right p-4">
                  ${position.avgPrice.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                </td>
                <td className="text-right p-4 font-bold">
                  ${position.currentPrice.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                </td>
                <td className="text-right p-4 font-medium">
                  ${position.value.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                </td>
                <td className="text-right p-4">
                  <div className="flex items-center justify-end">
                    {position.pnl >= 0 ? (
                      <TrendingUp className="w-4 h-4 text-success mr-2" />
                    ) : (
                      <TrendingDown className="w-4 h-4 text-danger mr-2" />
                    )}
                    <div className={cn("font-bold", position.pnl >= 0 ? "text-success" : "text-danger")}>
                      <div>${Math.abs(position.pnl).toLocaleString("en-US", { minimumFractionDigits: 2 })}</div>
                      <div className="text-xs">
                        {position.pnl >= 0 ? "+" : ""}{position.pnlPercent.toFixed(2)}%
                      </div>
                    </div>
                  </div>
                </td>
                <td className="text-right p-4">
                  <div className="flex justify-end space-x-2">
                    <Button variant="outline" size="sm" className="h-8">
                      Fechar
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="p-4 border-t border-surface">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-surface/50 p-3 rounded-lg">
            <div className="text-sm text-gray-400">Posições Ativas</div>
            <div className="text-xl font-bold">{positions.length}</div>
          </div>
          <div className="bg-surface/50 p-3 rounded-lg">
            <div className="text-sm text-gray-400">Exposição Total</div>
            <div className="text-xl font-bold">${totalValue.toLocaleString("en-US", { minimumFractionDigits: 0 })}</div>
          </div>
          <div className="bg-surface/50 p-3 rounded-lg">
            <div className="text-sm text-gray-400">P&L do Dia</div>
            <div className={cn("text-xl font-bold", totalPnl >= 0 ? "text-success" : "text-danger")}>
              {totalPnl >= 0 ? "+" : ""}${totalPnl.toLocaleString("en-US", { minimumFractionDigits: 2 })}
            </div>
          </div>
          <div className="bg-surface/50 p-3 rounded-lg">
            <div className="text-sm text-gray-400">Win Rate</div>
            <div className="text-xl font-bold text-success">75%</div>
          </div>
        </div>
      </div>
    </Card>
  )
}
