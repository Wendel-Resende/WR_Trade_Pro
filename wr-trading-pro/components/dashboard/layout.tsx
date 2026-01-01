"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { CyberBadge } from "@/components/ui/cyber-badge"
import { 
  Home, 
  BarChart3, 
  Wallet, 
  TrendingUp, 
  Bell, 
  Settings,
  Menu,
  X,
  User
} from "lucide-react"

interface DashboardLayoutProps {
  children: React.ReactNode
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [activeMenu, setActiveMenu] = useState("dashboard")

  const menuItems = [
    { id: "dashboard", label: "Dashboard", icon: <Home className="w-5 h-5" /> },
    { id: "markets", label: "Mercados", icon: <BarChart3 className="w-5 h-5" /> },
    { id: "portfolio", label: "Portfólio", icon: <Wallet className="w-5 h-5" /> },
    { id: "trading", label: "Trading", icon: <TrendingUp className="w-5 h-5" /> },
    { id: "alerts", label: "Alertas", icon: <Bell className="w-5 h-5" /> },
    { id: "settings", label: "Configurações", icon: <Settings className="w-5 h-5" /> },
  ]

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-surface bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-16 items-center px-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="mr-2"
          >
            {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>

          <div className="flex items-center space-x-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-r from-primary to-secondary flex items-center justify-center">
              <span className="font-orbitron font-bold text-white">WR</span>
            </div>
            <div>
              <h1 className="font-orbitron text-xl font-bold tracking-wider">
                WR Trading Pro
              </h1>
              <p className="text-xs text-gray-400">Trading Quantitativo</p>
            </div>
          </div>

          <div className="ml-auto flex items-center space-x-4">
            <CyberBadge variant="success" className="font-jetbrains">
              LIVE
            </CyberBadge>
            
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-5 w-5" />
              <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-danger"></span>
            </Button>

            <div className="flex items-center space-x-2">
              <div className="h-8 w-8 rounded-full bg-surface flex items-center justify-center">
                <User className="h-4 w-4" />
              </div>
              <div className="hidden md:block">
                <p className="text-sm font-medium">Trader</p>
                <p className="text-xs text-gray-400">conta@wrtrading.com</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside
          className={cn(
            "border-r border-surface bg-surface/50 transition-all duration-300",
            sidebarOpen ? "w-64" : "w-0 overflow-hidden",
            "lg:w-64"
          )}
        >
          <nav className="p-4 space-y-1">
            {menuItems.map((item) => (
              <Button
                key={item.id}
                variant={activeMenu === item.id ? "secondary" : "ghost"}
                className={cn(
                  "w-full justify-start font-orbitron tracking-wider",
                  activeMenu === item.id && "bg-secondary/20 text-secondary"
                )}
                onClick={() => setActiveMenu(item.id)}
              >
                {item.icon}
                <span className="ml-3">{item.label}</span>
              </Button>
            ))}
          </nav>

          <div className="p-4 border-t border-surface">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">Saldo Disponível</span>
                <CyberBadge variant="success" size="sm">
                  $50,240.85
                </CyberBadge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">P&L do Dia</span>
                <CyberBadge variant="success" size="sm">
                  +$1,250.50
                </CyberBadge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">Posições Abertas</span>
                <CyberBadge variant="primary" size="sm">
                  3
                </CyberBadge>
              </div>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-auto">
          <div className="p-4 space-y-4">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
