'use client';

import { useState } from 'react';

export default function Header() {
  const [notifications] = useState(3);

  return (
    <header className="h-12 bg-surface border-b border-primary/30 flex items-center justify-between px-3">
      {/* Symbol Selector */}
      <div className="flex items-center gap-3">
        <select className="bg-background border border-secondary/50 rounded px-2 py-1 text-xs text-secondary font-semibold focus:outline-none focus:border-secondary">
          <option>EURUSD</option>
          <option>GBPUSD</option>
          <option>USDJPY</option>
          <option>BTCUSD</option>
          <option>ETHUSD</option>
        </select>
        
        <div className="flex items-center gap-1">
          <div className="w-1.5 h-1.5 bg-success rounded-full animate-pulse"></div>
          <span className="text-[10px] text-success font-semibold">LIVE</span>
        </div>
      </div>

      {/* User Menu */}
      <div className="flex items-center gap-2">
        {/* Notifications */}
        <button className="relative p-1 hover:bg-surface/50 rounded">
          <span className="text-sm">🔔</span>
          {notifications > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-danger text-white text-[10px] rounded-full flex items-center justify-center">
              {notifications}
            </span>
          )}
        </button>

        {/* User */}
        <div className="flex items-center gap-2 px-2 py-1 bg-surface/50 rounded border border-primary/30">
          <div className="w-6 h-6 bg-primary/20 rounded-full flex items-center justify-center text-primary text-xs font-bold">
            W
          </div>
          <div>
            <div className="text-xs font-semibold text-primary">Wendel</div>
            <div className="text-[10px] text-gray-500">Sargento</div>
          </div>
        </div>
      </div>
    </header>
  );
}
