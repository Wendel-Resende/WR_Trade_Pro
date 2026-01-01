'use client';

export default function OrderBookCard() {
  const bids = [
    { price: 1.0845, volume: 0.65 },
    { price: 1.0844, volume: 0.88 },
    { price: 1.0843, volume: 1.23 },
    { price: 1.0842, volume: 0.54 },
    { price: 1.0841, volume: 0.92 },
  ];

  const asks = [
    { price: 1.0846, volume: 0.65 },
    { price: 1.0847, volume: 0.42 },
    { price: 1.0848, volume: 0.78 },
    { price: 1.0849, volume: 1.15 },
    { price: 1.0850, volume: 0.63 },
  ];

  return (
    <div className="bg-surface border border-gray-800 rounded-xl p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-white flex items-center gap-2">
          <span>📊</span> Order Book
        </h3>
        <div className="text-sm text-muted">EURUSD</div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Bids */}
        <div>
          <div className="text-xs text-success font-semibold mb-3">BIDS (Compra)</div>
          <div className="space-y-2">
            {bids.map((bid, index) => (
              <div key={index} className="flex justify-between items-center">
                <span className="text-success font-mono text-sm">{bid.price.toFixed(4)}</span>
                <span className="text-gray-400 text-sm">{bid.volume.toFixed(2)}M</span>
              </div>
            ))}
          </div>
        </div>

        {/* Asks */}
        <div>
          <div className="text-xs text-danger font-semibold mb-3">ASKS (Venda)</div>
          <div className="space-y-2">
            {asks.map((ask, index) => (
              <div key={index} className="flex justify-between items-center">
                <span className="text-danger font-mono text-sm">{ask.price.toFixed(4)}</span>
                <span className="text-gray-400 text-sm">{ask.volume.toFixed(2)}M</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-6 pt-6 border-t border-gray-800">
        <div className="flex justify-between text-sm">
          <span className="text-muted">Spread</span>
          <span className="text-white font-semibold">0.0001</span>
        </div>
        <div className="flex justify-between text-sm mt-2">
          <span className="text-muted">Volume Total</span>
          <span className="text-white font-semibold">8.85M</span>
        </div>
      </div>
    </div>
  );
}
