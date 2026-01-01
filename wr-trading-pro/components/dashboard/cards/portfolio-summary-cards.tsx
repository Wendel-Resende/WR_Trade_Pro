'use client';

import { trpc } from '@/lib/trpc/client';

export default function PortfolioSummaryCards() {
  const { data: portfolioStats, isLoading } = trpc.portfolio.getPortfolioStats.useQuery();
  
  const cards = [
    {
      title: 'Portfolio',
      value: portfolioStats ? `$${portfolioStats.totalValue.toFixed(2)}` : '$0.00',
      change: portfolioStats ? `${portfolioStats.returnPercent >= 0 ? '+' : ''}${portfolioStats.returnPercent.toFixed(2)}%` : '+0.00%',
      changeLabel: 'retorno',
      description: portfolioStats ? `${portfolioStats.positionCount} posições` : 'Loading...',
      color: 'text-white',
      bgColor: 'bg-gray-900',
      isLoading,
    },
    {
      title: 'P&L Diário',
      value: portfolioStats ? `${portfolioStats.totalPnL >= 0 ? '+' : ''}$${Math.abs(portfolioStats.totalPnL).toFixed(2)}` : '+$0.00',
      change: portfolioStats ? `${portfolioStats.totalPnL >= 0 ? '+' : ''}${(portfolioStats.totalPnL / (portfolioStats.totalInvested || 1) * 100).toFixed(2)}%` : '+0.00%',
      changeLabel: 'vs investido',
      description: portfolioStats ? `${portfolioStats.longCount}L ${portfolioStats.shortCount}S` : 'Loading...',
      color: portfolioStats ? (portfolioStats.totalPnL >= 0 ? 'text-success' : 'text-danger') : 'text-white',
      bgColor: 'bg-gray-900',
      isLoading,
    },
    {
      title: 'Posições',
      value: portfolioStats ? portfolioStats.positionCount.toString() : '0',
      change: portfolioStats ? `${portfolioStats.longCount}L ${portfolioStats.shortCount}S` : '0L 0S',
      changeLabel: 'L/S',
      description: portfolioStats ? `$${portfolioStats.longValue.toFixed(0)}L / $${portfolioStats.shortValue.toFixed(0)}S` : 'Loading...',
      color: 'text-white',
      bgColor: 'bg-gray-900',
      isLoading,
    },
    {
      title: 'Risco',
      value: portfolioStats ? (portfolioStats.totalValue > 100000 ? 'Alto' : portfolioStats.totalValue > 50000 ? 'Médio' : 'Baixo') : 'Baixo',
      change: portfolioStats ? `${((portfolioStats.shortValue / (portfolioStats.totalValue || 1)) * 100).toFixed(0)}%` : '0%',
      changeLabel: 'short',
      description: portfolioStats ? `$${portfolioStats.totalInvested.toFixed(0)} investido` : 'Loading...',
      color: portfolioStats ? (portfolioStats.totalValue > 100000 ? 'text-danger' : portfolioStats.totalValue > 50000 ? 'text-yellow-400' : 'text-success') : 'text-success',
      bgColor: 'bg-gray-900',
      isLoading,
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2">
      {cards.map((card, index) => (
        <div
          key={index}
          className="bg-surface border border-gray-800 rounded-lg p-3 hover:border-gray-700 transition-colors"
        >
          <div className="flex items-start justify-between mb-2">
            <div>
              <h3 className="text-[10px] font-semibold text-muted mb-0.5">{card.title}</h3>
              {card.isLoading ? (
                <div className="h-4 w-16 bg-gray-800 rounded animate-pulse"></div>
              ) : (
                <div className={`text-sm font-bold ${card.color}`}>{card.value}</div>
              )}
            </div>
            <div className={`text-[10px] font-semibold ${card.color.includes('success') ? 'text-success bg-success/10' : card.color.includes('danger') ? 'text-danger bg-danger/10' : 'text-white bg-white/10'} px-1.5 py-0.5 rounded`}>
              {card.isLoading ? '...' : card.change}
            </div>
          </div>
          
          <div className="space-y-1">
            <div className="text-[10px] text-muted">{card.changeLabel}</div>
            {card.isLoading ? (
              <div className="h-3 w-16 bg-gray-800 rounded animate-pulse"></div>
            ) : (
              <div className="text-xs text-gray-400 truncate">{card.description}</div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
