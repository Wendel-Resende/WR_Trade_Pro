'use client';

import { DashboardLayout } from '@/components/dashboard/layout';

export default function PortfolioPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <h1 className="text-4xl font-bold text-primary">Portfólio</h1>
        <p className="text-gray-400">Página em construção...</p>
        <div className="neon-card p-6">
          <p>Esta página exibirá suas posições, histórico de trades, etc.</p>
        </div>
      </div>
    </DashboardLayout>
  );
}
