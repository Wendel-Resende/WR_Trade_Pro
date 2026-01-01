import type { Metadata } from 'next'
import { Inter, Orbitron, JetBrains_Mono } from 'next/font/google'
import './globals.css'
import { ThemeProvider } from '@/components/theme-provider'
import { WebSocketProvider } from '@/contexts/WebSocketProvider'
import { TRPCProvider } from '@/lib/trpc/Provider'

const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-inter',
})

const orbitron = Orbitron({
  subsets: ['latin'],
  variable: '--font-orbitron',
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains-mono',
})

export const metadata: Metadata = {
  title: 'WR Trading Pro - Plataforma de Trading Quantitativo',
  description: 'Plataforma avançada de trading quantitativo com análise em tempo real e automação',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR" suppressHydrationWarning className={`${inter.variable} ${orbitron.variable} ${jetbrainsMono.variable}`}>
      <body className="bg-background text-foreground font-inter">
        <TRPCProvider>
          <WebSocketProvider>
            <ThemeProvider
              attribute="class"
              defaultTheme="dark"
              enableSystem
              disableTransitionOnChange
            >
              <div className="h-screen relative overflow-hidden">
                {/* Scanline effect */}
                <div className="scanline"></div>
                
                {/* Grid background */}
                <div className="absolute inset-0 bg-grid-cyber opacity-10"></div>
                
                {children}
              </div>
            </ThemeProvider>
          </WebSocketProvider>
        </TRPCProvider>
      </body>
    </html>
  )
}
