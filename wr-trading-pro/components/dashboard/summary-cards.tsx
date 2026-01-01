'use client';

export default function SummaryCards() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {/* Card 1: Portfolio Value */}
      <div className="bg-surface/50 border border-cyan-500/30 rounded-lg p-4">
        <div className="text-sm text-gray-400 mb-1">Portfolio Value</div>
        <div className="text-3xl font-bold text-white mb-1">$50,240.85</div>
        <div className="flex items-center gap-2 text-xs">
          <span className="text-success">+2.85%</span>
          <span className="text-gray-500">today</span>
        </div>
        <div className="text-xs text-gray-500 mt-2">3 winning trades</div>
      </div>

      {/* Card 2: Daily P&L */}
      <div className="bg-surface/50 border border-green-500/30 rounded-lg p-4">
        <div className="text-sm text-gray-400 mb-1">Daily P&L</div>
        <div className="text-3xl font-bold text-success mb-1">+$1,250.50</div>
        <div className="flex items-center gap-2 text-xs">
          <span className="text-success">+3.2%</span>
          <span className="text-gray-500">vs yesterday</span>
        </div>
        <div className="text-xs text-gray-500 mt-2">5 positions closed</div>
      </div>

      {/* Card 3: Active Positions */}
      <div className="bg-surface/50 border border-pink-500/30 rounded-lg p-4">
        <div className="text-sm text-gray-400 mb-1">Active Positions</div>
        <div className="text-3xl font-bold text-white mb-1">5</div>
        <div className="text-xs text-gray-500">this week</div>
        <div className="text-xs text-gray-400 mt-2">3 long, 2 short</div>
      </div>

      {/* Card 4: Risk Level */}
      <div className="bg-surface/50 border border-purple-500/30 rounded-lg p-4">
        <div className="text-sm text-gray-400 mb-1">Risk Level</div>
        <div className="flex items-center justify-between mb-1">
          <div className="text-3xl font-bold text-yellow-400">Medium</div>
          <div className="relative w-16 h-16">
            <svg className="transform -rotate-90 w-16 h-16">
              <circle
                cx="32"
                cy="32"
                r="28"
                stroke="#1A1F3A"
                strokeWidth="6"
                fill="none"
              />
              <circle
                cx="32"
                cy="32"
                r="28"
                stroke="#FBBF24"
                strokeWidth="6"
                fill="none"
                strokeDasharray={`${2 * Math.PI * 28 * 0.24} ${2 * Math.PI * 28}`}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center text-xs font-bold text-yellow-400">
              24%
            </div>
          </div>
        </div>
        <div className="text-xs text-gray-500">exposure</div>
        <div className="text-xs text-gray-400 mt-1">Within limits</div>
      </div>
    </div>
  );
}
