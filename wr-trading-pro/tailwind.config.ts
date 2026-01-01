import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: ['class'],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    container: {
      center: true,
      padding: '2rem',
      screens: {
        '2xl': '1400px',
      },
    },
    extend: {
      colors: {
        // Cyberpunk theme colors
        primary: {
          DEFAULT: '#FF006E', // Rosa neon
          foreground: '#FFFFFF',
        },
        secondary: {
          DEFAULT: '#00F5FF', // Ciano
          foreground: '#0A0E27',
        },
        background: '#0A0E27', // Preto profundo
        foreground: '#FFFFFF',
        surface: '#1A1F3A', // Cinza escuro
        accent: '#9D4EDD', // Roxo
        success: '#39FF14', // Verde neon
        danger: '#FF073A', // Vermelho neon
        border: '#1A1F3A',
        
        // Trading colors
        trading: {
          profit: '#39FF14', // Verde neon
          loss: '#FF073A', // Vermelho neon
          neutral: '#00F5FF', // Ciano
          warning: '#FFB800',
          bitcoin: '#F7931A',
          ethereum: '#627EEA',
          solana: '#00FFA3',
        },
        cyber: {
          pink: '#FF006E',
          blue: '#00F5FF',
          purple: '#9D4EDD',
          green: '#39FF14',
          red: '#FF073A',
          yellow: '#FFB800',
          orange: '#FF7700',
        },
      },
      borderColor: {
        surface: '#1A1F3A',
        border: '#1A1F3A',
      },
      fontFamily: {
        'orbitron': ['Orbitron', 'sans-serif'],
        'inter': ['Inter', 'sans-serif'],
        'jetbrains': ['"JetBrains Mono"', 'monospace'],
      },
      animation: {
        'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
        'glitch': 'glitch 0.3s linear infinite',
        'scanline': 'scanline 10s linear infinite',
        'ticker-scroll': 'ticker-scroll 20s linear infinite',
        'candle-flicker': 'candle-flicker 1.5s infinite alternate',
      },
      keyframes: {
        'pulse-glow': {
          '0%, 100%': { opacity: '1', boxShadow: '0 0 20px #00ff9d' },
          '50%': { opacity: '0.7', boxShadow: '0 0 40px #00d4ff' },
        },
        'glitch': {
          '0%': { transform: 'translate(0)' },
          '20%': { transform: 'translate(-2px, 2px)' },
          '40%': { transform: 'translate(-2px, -2px)' },
          '60%': { transform: 'translate(2px, 2px)' },
          '80%': { transform: 'translate(2px, -2px)' },
          '100%': { transform: 'translate(0)' },
        },
        'scanline': {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100vh)' },
        },
        'ticker-scroll': {
          '0%': { transform: 'translateX(100%)' },
          '100%': { transform: 'translateX(-100%)' },
        },
        'candle-flicker': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.8' },
        },
      },
      backgroundImage: {
        'trading-grid': 'linear-gradient(rgba(0, 212, 255, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 212, 255, 0.1) 1px, transparent 1px)',
        'cyber-gradient': 'linear-gradient(45deg, #ff00ff, #00ffff, #00ff9d)',
        'profit-gradient': 'linear-gradient(135deg, #00ff9d, #00d4ff)',
        'loss-gradient': 'linear-gradient(135deg, #ff375f, #ff7700)',
      },
      boxShadow: {
        'trading-card': '0 0 20px rgba(0, 212, 255, 0.3)',
        'profit-glow': '0 0 15px #00ff9d',
        'loss-glow': '0 0 15px #ff375f',
        'cyber-glow': '0 0 20px #ff00ff, 0 0 40px #00ffff',
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
}

export default config
