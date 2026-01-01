import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-[#0A0E27] via-[#1A1F3A] to-[#0A0E27] flex items-center justify-center p-4">
      <div className="text-center space-y-8 max-w-2xl">
        {/* Logo/Título */}
        <div className="space-y-4">
          <h1 className="text-6xl md:text-7xl font-bold bg-gradient-to-r from-cyan-400 via-pink-400 to-purple-400 bg-clip-text text-transparent animate-pulse">
            WR Trading Pro
          </h1>
          <p className="text-xl md:text-2xl text-gray-400">
            Plataforma Quantitativa de Trading com IA
          </p>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 my-8">
          <div className="bg-surface/50 border border-cyan-500/30 rounded-lg p-4">
            <div className="text-3xl mb-2">📊</div>
            <div className="text-sm text-gray-400">Análise em Tempo Real</div>
          </div>
          <div className="bg-surface/50 border border-pink-500/30 rounded-lg p-4">
            <div className="text-3xl mb-2">🤖</div>
            <div className="text-sm text-gray-400">Machine Learning</div>
          </div>
          <div className="bg-surface/50 border border-purple-500/30 rounded-lg p-4">
            <div className="text-3xl mb-2">⚡</div>
            <div className="text-sm text-gray-400">Execução Rápida</div>
          </div>
        </div>

        {/* Botão Principal */}
        <div className="space-y-4">
          <Link 
            href="/dashboard"
            className="inline-block px-10 py-4 bg-gradient-to-r from-cyan-500 via-pink-500 to-purple-500 rounded-lg text-white font-bold text-lg hover:from-cyan-600 hover:via-pink-600 hover:to-purple-600 transition-all duration-300 shadow-lg hover:shadow-2xl hover:scale-105 transform"
          >
            🚀 Acessar Dashboard
          </Link>
          
          {/* Link alternativo para teste */}
          <div>
            <a 
              href="/dashboard" 
              className="text-sm text-cyan-400 hover:text-cyan-300 underline"
            >
              ou clique aqui (link direto)
            </a>
          </div>
        </div>

        {/* Versão */}
        <div className="text-xs text-gray-600 mt-8">
          v1.0.0 Beta • MetaTrader 5 Integration
        </div>
      </div>
    </main>
  );
}
