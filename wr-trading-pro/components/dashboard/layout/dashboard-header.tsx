'use client';

import { useState } from 'react';

export default function DashboardHeader() {
  const [notifications] = useState(3);

  return (
    <header className="h-16 bg-surface border-b border-gray-800 flex items-center justify-between px-6">
      {/* Left: Symbol Selector */}
      <div className="flex items-center gap-4">
        <div className="relative">
          <select className="bg-background border border-gray-700 rounded-lg px-4 py-2 text-white font-semibold focus:outline-none focus:border-secondary appearance-none pr-8">
            <option>EURUSD</option>
            <option>GBPUSD</option>
            <option>USDJPY</option>
            <option>BTCUSD</option>
            <option>ETHUSD</option>
          </select>
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
        
        {/* Live Indicator */}
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-success rounded-full animate-pulse"></div>
          <span className="text-xs text-success font-semibold">• LIVE</span>
        </div>
      </div>

      {/* Right: User Menu */}
      <div className="flex items-center gap-4">
        {/* Notifications */}
        <button className="relative p-2 hover:bg-gray-800/50 rounded-lg transition-colors">
          <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
          {notifications > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-danger text-white text-xs rounded-full flex items-center justify-center">
              {notifications}
            </span>
          )}
        </button>

        {/* User Profile */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center text-primary font-bold">
            W
          </div>
          <div className="hidden md:block">
            <div className="text-sm font-semibold text-white">Trader</div>
            <div className="text-xs text-muted">conta@wrtrading.com</div>
          </div>
        </div>
      </div>
    </header>
  );
}
