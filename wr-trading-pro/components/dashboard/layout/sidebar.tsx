'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { wsClient } from '@/lib/websocket/client';
import { useState, useEffect } from 'react';

const menuItems = [
  { icon: '🏠', label: 'Dashboard', href: '/dashboard' },
  { icon: '📈', label: 'Mercados', href: '/dashboard/markets' },
  { icon: '💼', label: 'Portfólio', href: '/dashboard/portfolio' },
  { icon: '↕️', label: 'Trading', href: '/dashboard/trading' },
  { icon: '🔔', label: 'Alertas', href: '/dashboard/alerts' },
  { icon: '⚙️', label: 'Configurações', href: '/dashboard/settings' },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [accountInfo, setAccountInfo] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Buscar informações da conta do MT5
    const fetchAccountInfo = async () => {
      try {
        if (wsClient.getIsConnected()) {
          const info = await wsClient.getAccountInfo();
          setAccountInfo(info);
          setIsLoading(false);
        }
      } catch (error) {
        console.error('Erro ao buscar info da conta:', error);
        setIsLoading(false);
      }
    };

    // Buscar imediatamente
    fetchAccountInfo();

    // Atualizar a cada 10 segundos
    const interval = setInterval(fetchAccountInfo, 10000);

    // Ouvir eventos de atualização de conta
    const handleAccountUpdate = (data: { account: any }) => {
      if (data.account) {
        setAccountInfo(data.account);
      }
    };

    wsClient.on('account_info', handleAccountUpdate);

    return () => {
      clearInterval(interval);
      wsClient.off('account_info', handleAccountUpdate);
    };
  }, []);

  // Ouvir eventos de conexão
  useEffect(() => {
    const handleConnect = () => setIsConnected(true);
    const handleDisconnect = () => setIsConnected(false);

    wsClient.on('connected', handleConnect);
    wsClient.on('disconnected', handleDisconnect);

    // Verificar estado inicial
    setIsConnected(wsClient.getIsConnected());

    return () => {
      wsClient.off('connected', handleConnect);
      wsClient.off('disconnected', handleDisconnect);
    };
  }, []);

  // Calcular P&L do dia (simplificado - usa profit atual)
  const dailyPnL = accountInfo?.profit || 0;
  const balance = accountInfo?.balance || 0;
  const equity = accountInfo?.equity || 0;
  const margin = accountInfo?.margin || 0;
  const freeMargin = accountInfo?.free_margin || 0;
  
  // Calcular número aproximado de posições abertas baseado na margem usada
  const openPositions = margin > 0 ? Math.ceil(margin / 1000) : 0;

  return (
    <aside className="w-64 flex-shrink-0 bg-surface border-r border-gray-800 flex flex-col overflow-y-auto">
      {/* Logo */}
      <div className="p-3 border-b border-gray-800">
        <h1 className="text-lg font-bold text-white">WR Trading</h1>
        <p className="text-[10px] text-muted mt-0.5">Quantitative</p>
      </div>

      {/* Menu */}
      <nav className="flex-1 p-2 space-y-1">
        {menuItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-2 px-2 py-2 rounded transition-all ${
                isActive
                  ? 'bg-secondary/20 border border-secondary text-secondary'
                  : 'hover:bg-gray-800/50 text-gray-400 hover:text-white'
              }`}
            >
              <span className="text-base">{item.icon}</span>
              <span className="text-xs font-semibold">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Stats */}
      <div className="p-3 border-t border-gray-800 space-y-2">
        {!isConnected ? (
          <div className="text-center text-gray-500">
            <div className="animate-pulse">⚠️ Desconectado do MT5</div>
          </div>
        ) : isLoading ? (
          <div className="text-center text-gray-500">
            <div className="animate-pulse">Carregando dados...</div>
          </div>
        ) : accountInfo ? (
          <>
            {/* Saldo Disponível */}
            <div>
              <div className="text-[10px] text-muted">Saldo</div>
              <div className="text-sm font-bold text-success">
                ${balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            </div>
            
            {/* P&L do Dia */}
            <div>
              <div className="text-[10px] text-muted">P&L</div>
              <div className={`text-sm font-bold ${dailyPnL >= 0 ? 'text-success' : 'text-danger'}`}>
                {dailyPnL >= 0 ? '+' : ''}${dailyPnL.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            </div>
            
            {/* Equity */}
            <div>
              <div className="text-[10px] text-muted">Equity</div>
              <div className="text-sm font-bold text-white">
                ${equity.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            </div>

            {/* Posições Abertas */}
            <div className="flex items-center justify-between">
              <div>
                <div className="text-[10px] text-muted">Posições</div>
                <div className="text-sm font-bold text-white">{openPositions}</div>
              </div>
              <div className={`w-2 h-2 rounded-full ${openPositions > 0 ? 'bg-warning' : 'bg-success'}`}></div>
            </div>

            {/* Conta Info */}
            <div className="text-[10px] text-muted pt-1 border-t border-gray-700 space-y-0.5">
              <div>Login: {accountInfo.login}</div>
              <div className="truncate">Servidor: {accountInfo.server}</div>
            </div>
          </>
        ) : (
          <div className="text-center text-danger text-[10px]">
            Erro
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-2 border-t border-gray-800">
        <div className="text-[10px] text-muted text-center">
          v1.0.0
        </div>
      </div>
    </aside>
  );
}
