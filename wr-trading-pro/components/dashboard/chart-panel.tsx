"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  LineChart, 
  BarChart3, 
  TrendingUp, 
  Settings,
  Zap,
  Activity
} from "lucide-react"

const timeframes = [
  { value: "1m", label: "1 min" },
  { value: "5m", label: "5 min" },
  { value: "15m", label: "15 min" },
  { value: "1h", label: "1 hora" },
  { value: "4h", label: "4 horas" },
  { value: "1d", label: "1 dia" },
  { value: "1w", label: "1 semana" },
]

const indicators = [
  { id: "sma", label: "SMA", active: true },
  { id: "ema", label: "EMA", active: false },
  { id: "rsi", label: "RSI", active: true },
  { id: "macd", label: "MACD", active: false },
  { id: "bb", label: "Bollinger", active: true },
]

export function ChartPanel() {
  const [selectedTimeframe, setSelectedTimeframe] = useState("1h")
  const [selectedChart, setSelectedChart] = useState("candles")
  const [activeIndicators, setActiveIndicators] = useState(indicators)

  const toggleIndicator = (id: string) => {
    setActiveIndicators(prev =>
      prev.map(indicator =>
        indicator.id === id
          ? { ...indicator, active: !indicator.active }
          : indicator
      )
    )
  }

  return (
    <Card className="bg-surface border-surface">
      <div className="p-4 border-b border-surface">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div>
              <h3 className="font-orbitron text-lg font-bold tracking-wider">
                BTC/USD
              </h3>
              <div className="flex items-center space-x-2 mt-1">
                <span className="text-2xl font-bold">$45,023.50</span>
                <span className="text-success font-bold">+2.85%</span>
                <span className="text-xs text-gray-400">24h volume: $28.5B</span>
              </div>
            </div>
            
            <div className="hidden md:flex items-center space-x-2">
              <span className="text-sm text-gray-400">High:</span>
              <span className="font-bold">$45,850.00</span>
              <span className="text-sm text-gray-400 ml-4">Low:</span>
              <span className="font-bold">$44,200.00</span>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" className="font-jetbrains">
              <Zap className="w-4 h-4 mr-2" />
              TradingView
            </Button>
            <Button variant="ghost" size="icon">
              <Settings className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className="p-4 border-b border-surface">
        <div className="flex flex-col md:flex-row md:items-center justify-between space-y-4 md:space-y-0">
          <Tabs
            value={selectedChart}
            onValueChange={setSelectedChart}
            className="w-full md:w-auto"
          >
            <TabsList className="bg-surface">
              <TabsTrigger value="candles" className="flex items-center">
                <BarChart3 className="w-4 h-4 mr-2" />
                Candles
              </TabsTrigger>
              <TabsTrigger value="line" className="flex items-center">
                <LineChart className="w-4 h-4 mr-2" />
                Line
              </TabsTrigger>
              <TabsTrigger value="depth" className="flex items-center">
                <TrendingUp className="w-4 h-4 mr-2" />
                Depth
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-400">Indicadores:</span>
              <div className="flex flex-wrap gap-2">
                {activeIndicators.map(indicator => (
                  <Button
                    key={indicator.id}
                    variant={indicator.active ? "secondary" : "outline"}
                    size="sm"
                    className={cn(
                      "h-7 text-xs",
                      indicator.active && "bg-secondary/20"
                    )}
                    onClick={() => toggleIndicator(indicator.id)}
                  >
                    {indicator.label}
                    {indicator.active && (
                      <div className="ml-2 h-2 w-2 rounded-full bg-success"></div>
                    )}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="p-4">
        {/* Timeframe selector */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex space-x-2 overflow-x-auto">
            {timeframes.map(timeframe => (
              <Button
                key={timeframe.value}
                variant={selectedTimeframe === timeframe.value ? "secondary" : "ghost"}
                size="sm"
                className={cn(
                  "font-jetbrains text-xs",
                  selectedTimeframe === timeframe.value && "bg-secondary/20"
                )}
                onClick={() => setSelectedTimeframe(timeframe.value)}
              >
                {timeframe.label}
              </Button>
            ))}
          </div>

          <div className="flex items-center space-x-2">
            <Button variant="ghost" size="sm" className="text-xs">
              <Activity className="w-3 h-3 mr-1" />
              Auto-refresh
            </Button>
          </div>
        </div>

        {/* Chart placeholder */}
        <div className="relative h-64 md:h-96 bg-background rounded-lg border border-surface overflow-hidden">
          {/* Grid lines */}
          <div className="absolute inset-0 bg-grid-cyber opacity-10"></div>
          
          {/* Price labels */}
          <div className="absolute left-4 top-4 flex flex-col space-y-8">
            {[46000, 45500, 45000, 44500, 44000].map(price => (
              <div key={price} className="text-xs text-gray-400 font-jetbrains">
                ${price.toLocaleString()}
              </div>
            ))}
          </div>

          {/* Time labels */}
          <div className="absolute bottom-4 right-4 flex space-x-8">
            {["09:00", "12:00", "15:00", "18:00", "21:00"].map(time => (
              <div key={time} className="text-xs text-gray-400 font-jetbrains">
                {time}
              </div>
            ))}
          </div>

          {/* Mock chart data */}
          <div className="absolute inset-0 p-8">
            <svg className="w-full h-full" viewBox="0 0 400 200">
              {/* Price line */}
              <path
                d="M0,150 L50,140 L100,160 L150,130 L200,170 L250,120 L300,180 L350,110 L400,150"
                fill="none"
                stroke="url(#chart-gradient)"
                strokeWidth="2"
                className="animate-pulse-glow"
              />
              
              {/* Area under line */}
              <path
                d="M0,150 L50,140 L100,160 L150,130 L200,170 L250,120 L300,180 L350,110 L400,150 L400,200 L0,200 Z"
                fill="url(#area-gradient)"
                fillOpacity="0.2"
              />
              
              {/* Current price indicator */}
              <circle cx="400" cy="150" r="4" fill="#00F5FF" className="animate-pulse">
                <animate
                  attributeName="r"
                  values="4;6;4"
                  dur="1s"
                  repeatCount="indefinite"
                />
              </circle>
              
              <defs>
                <linearGradient id="chart-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#FF006E" />
                  <stop offset="50%" stopColor="#00F5FF" />
                  <stop offset="100%" stopColor="#9D4EDD" />
                </linearGradient>
                
                <linearGradient id="area-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#00F5FF" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#00F5FF" stopOpacity="0" />
                </linearGradient>
              </defs>
            </svg>
          </div>

          {/* Current price line */}
          <div className="absolute left-0 right-0 top-1/2 border-t border-dashed border-secondary/30"></div>
          <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
            <div className="bg-surface px-2 py-1 rounded text-xs font-jetbrains border border-secondary">
              $45,023.50
            </div>
          </div>
        </div>

        {/* Chart controls */}
        <div className="flex items-center justify-between mt-4">
          <div className="text-sm text-gray-400">
            Última atualização: {new Date().toLocaleTimeString("pt-BR")}
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm">
              Comparar
            </Button>
            <Button variant="outline" size="sm">
              Exportar
            </Button>
            <Button variant="secondary" size="sm">
              Análise
            </Button>
          </div>
        </div>
      </div>
    </Card>
  )
}
