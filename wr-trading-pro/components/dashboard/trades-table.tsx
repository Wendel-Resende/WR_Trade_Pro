"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { Search, Filter, Download, ChevronLeft, ChevronRight } from "lucide-react"

interface Trade {
  id: string
  date: string
  symbol: string
  type: "BUY" | "SELL"
  quantity: number
  price: number
  fees: number
  total: number
  status: "FILLED" | "PARTIAL" | "CANCELLED"
}

export function TradesTable() {
  const [search, setSearch] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const tradesPerPage = 5

  const trades: Trade[] = [
    { id: "1", date: "2024-03-15 14:30:25", symbol: "BTC", type: "BUY", quantity: 0.5, price: 45023.50, fees: 22.51, total: 22511.75, status: "FILLED" },
    { id: "2", date: "2024-03-15 10:15:42", symbol: "ETH", type: "SELL", quantity: 2.0, price: 3201.25, fees: 6.40, total: 6402.50, status: "FILLED" },
    { id: "3", date: "2024-03-14 16:45:18", symbol: "AAPL", type: "BUY", quantity: 10, price: 185.42, fees: 1.85, total: 1854.20, status: "FILLED" },
    { id: "4", date: "2024-03-14 09:20:33", symbol: "TSLA", type: "BUY", quantity: 5, price: 245.80, fees: 1.23, total: 1229.00, status: "FILLED" },
    { id: "5", date: "2024-03-13 15:55:47", symbol: "MSFT", type: "SELL", quantity: 8, price: 415.75, fees: 3.33, total: 3326.00, status: "FILLED" },
    { id: "6", date: "2024-03-13 11:30:12", symbol: "GOOGL", type: "BUY", quantity: 15, price: 152.30, fees: 2.28, total: 2284.50, status: "FILLED" },
    { id: "7", date: "2024-03-12 13:45:29", symbol: "NVDA", type: "SELL", quantity: 3, price: 895.50, fees: 2.69, total: 2686.50, status: "FILLED" },
    { id: "8", date: "2024-03-12 08:15:56", symbol: "AMZN", type: "BUY", quantity: 12, price: 178.90, fees: 2.15, total: 2146.80, status: "FILLED" },
  ]

  const filteredTrades = trades.filter(trade =>
    trade.symbol.toLowerCase().includes(search.toLowerCase()) ||
    trade.type.toLowerCase().includes(search.toLowerCase()) ||
    trade.status.toLowerCase().includes(search.toLowerCase())
  )

  const totalPages = Math.ceil(filteredTrades.length / tradesPerPage)
  const startIndex = (currentPage - 1) * tradesPerPage
  const paginatedTrades = filteredTrades.slice(startIndex, startIndex + tradesPerPage)

  const totalTrades = trades.length
  const totalVolume = trades.reduce((sum, trade) => sum + trade.total, 0)
  const buyTrades = trades.filter(t => t.type === "BUY").length
  const sellTrades = trades.filter(t => t.type === "SELL").length

  return (
    <Card className="bg-surface border-surface h-full">
      <div className="p-4 border-b border-surface">
        <div className="flex flex-col md:flex-row md:items-center justify-between space-y-4 md:space-y-0">
          <div>
            <h3 className="font-orbitron text-lg font-bold tracking-wider">
              Histórico de Trades
            </h3>
            <p className="text-sm text-gray-400">
              {totalTrades} trades • Volume total: ${totalVolume.toLocaleString("en-US", { minimumFractionDigits: 2 })}
            </p>
          </div>

          <div className="flex items-center space-x-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Buscar trades..."
                className="pl-10 bg-background border-surface"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Button variant="outline" size="icon">
              <Filter className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="icon">
              <Download className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-surface">
              <th className="text-left p-4 text-sm text-gray-400 font-jetbrains">Data/Hora</th>
              <th className="text-left p-4 text-sm text-gray-400 font-jetbrains">Ativo</th>
              <th className="text-left p-4 text-sm text-gray-400 font-jetbrains">Tipo</th>
              <th className="text-right p-4 text-sm text-gray-400 font-jetbrains">Quantidade</th>
              <th className="text-right p-4 text-sm text-gray-400 font-jetbrains">Preço</th>
              <th className="text-right p-4 text-sm text-gray-400 font-jetbrains">Taxas</th>
              <th className="text-right p-4 text-sm text-gray-400 font-jetbrains">Total</th>
              <th className="text-left p-4 text-sm text-gray-400 font-jetbrains">Status</th>
            </tr>
          </thead>
          <tbody>
            {paginatedTrades.map((trade) => (
              <tr key={trade.id} className="border-b border-surface/50 hover:bg-surface/30">
                <td className="p-4">
                  <div className="text-sm">{trade.date.split(" ")[0]}</div>
                  <div className="text-xs text-gray-400">{trade.date.split(" ")[1]}</div>
                </td>
                <td className="p-4">
                  <div className="font-medium">{trade.symbol}</div>
                </td>
                <td className="p-4">
                  <div className={cn(
                    "inline-flex items-center px-2 py-1 rounded text-xs font-bold",
                    trade.type === "BUY" 
                      ? "bg-success/20 text-success" 
                      : "bg-danger/20 text-danger"
                  )}>
                    {trade.type}
                  </div>
                </td>
                <td className="text-right p-4 font-medium">
                  {trade.quantity.toLocaleString("en-US", { minimumFractionDigits: 4 })}
                </td>
                <td className="text-right p-4">
                  ${trade.price.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                </td>
                <td className="text-right p-4 text-gray-400">
                  ${trade.fees.toFixed(2)}
                </td>
                <td className="text-right p-4 font-bold">
                  ${trade.total.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                </td>
                <td className="p-4">
                  <div className={cn(
                    "inline-flex items-center px-2 py-1 rounded text-xs",
                    trade.status === "FILLED" 
                      ? "bg-success/20 text-success" 
                      : trade.status === "PARTIAL"
                      ? "bg-warning/20 text-warning"
                      : "bg-gray-500/20 text-gray-400"
                  )}>
                    {trade.status}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="p-4 border-t border-surface">
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-400">
            Mostrando {startIndex + 1}-{Math.min(startIndex + tradesPerPage, filteredTrades.length)} de {filteredTrades.length} trades
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum
              if (totalPages <= 5) {
                pageNum = i + 1
              } else if (currentPage <= 3) {
                pageNum = i + 1
              } else if (currentPage >= totalPages - 2) {
                pageNum = totalPages - 4 + i
              } else {
                pageNum = currentPage - 2 + i
              }
              
              return (
                <Button
                  key={pageNum}
                  variant={currentPage === pageNum ? "secondary" : "outline"}
                  size="sm"
                  className="w-8 h-8"
                  onClick={() => setCurrentPage(pageNum)}
                >
                  {pageNum}
                </Button>
              )
            })}
            
            <Button
              variant="outline"
              size="icon"
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="p-4 border-t border-surface">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-surface/50 p-3 rounded-lg">
            <div className="text-sm text-gray-400">Trades Hoje</div>
            <div className="text-xl font-bold">3</div>
          </div>
          <div className="bg-surface/50 p-3 rounded-lg">
            <div className="text-sm text-gray-400">Compras/Vendas</div>
            <div className="text-xl font-bold">
              <span className="text-success">{buyTrades}</span>/
              <span className="text-danger">{sellTrades}</span>
            </div>
          </div>
          <div className="bg-surface/50 p-3 rounded-lg">
            <div className="text-sm text-gray-400">Taxa Média</div>
            <div className="text-xl font-bold">0.12%</div>
          </div>
          <div className="bg-surface/50 p-3 rounded-lg">
            <div className="text-sm text-gray-400">Execução</div>
            <div className="text-xl font-bold text-success">99.8%</div>
          </div>
        </div>
      </div>
    </Card>
  )
}
