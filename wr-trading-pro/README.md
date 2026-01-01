# WR Trading Pro

Plataforma de trading quantitativo com tema cyberpunk construída com Next.js 14.

## 🚀 Tecnologias

- **Next.js 14** - Framework React com App Router e Server Components
- **TypeScript** - Tipagem estática com strict mode
- **Tailwind CSS** - Framework CSS utilitário com tema cyberpunk personalizado
- **shadcn/ui** - Componentes reutilizáveis
- **Prisma ORM** - ORM type-safe para PostgreSQL
- **tRPC** - API end-to-end typesafe
- **Recharts** - Biblioteca de gráficos para visualização de dados financeiros

## 📁 Estrutura do Projeto

```
wr-trading-pro/
├── app/                    # App Router pages
│   ├── api/               # API routes
│   ├── dashboard/         # Dashboard pages
│   └── (auth)/            # Authentication pages
│       ├── login/         # Página de login
│       └── register/      # Página de registro
├── components/
│   ├── ui/               # shadcn/ui components
│   ├── dashboard/        # Dashboard components
│   └── charts/           # Componentes de gráficos
├── lib/
│   ├── utils/            # Utilitários
│   ├── db/               # Database utilities
│   └── trpc/             # tRPC configuration
├── server/
│   ├── routers/          # tRPC routers
│   └── services/         # Business logic services
├── types/                # TypeScript types
├── prisma/               # Prisma schema
└── public/               # Arquivos estáticos
    └── fonts/            # Fontes personalizadas
```

## 🛠️ Configuração

1. **Instalar dependências:**
   ```bash
   npm install
   ```

2. **Configurar variáveis de ambiente:**
   ```bash
   cp .env.example .env.local
   ```
   Edite o arquivo `.env.local` com suas configurações.

3. **Configurar banco de dados:**
   ```bash
   npx prisma db push
   npx prisma generate
   ```

4. **Executar servidor de desenvolvimento:**
   ```bash
   npm run dev
   ```

5. **Abrir no navegador:**
   ```
   http://localhost:3000
   ```

## 📦 Scripts Disponíveis

- `npm run dev` - Inicia servidor de desenvolvimento
- `npm run build` - Cria build de produção
- `npm start` - Inicia servidor de produção
- `npm run lint` - Executa ESLint
- `npm run format` - Formata código com Prettier
- `npm run db:push` - Sincroniza schema com banco de dados
- `npm run db:studio` - Abre Prisma Studio

## 🎨 Tema Cyberpunk Trading

O projeto inclui um tema cyberpunk personalizado para trading com:
- Cores específicas para trading (profit/loss)
- Gráficos com estilo futurista
- Animações de glitch, scanline e ticker
- Efeitos de sombra neon
- Background com grid de trading

## 📊 Funcionalidades Principais

- **Dashboard** - Visão geral de métricas e performance
- **Gráficos** - Visualização de dados financeiros em tempo real
- **Estratégias** - Gerenciamento de estratégias de trading
- **Portfólio** - Acompanhamento de ativos e performance
- **Autenticação** - Sistema de login/registro seguro
- **API Trading** - Integração com corretoras

## 🔧 Configurações Específicas

### Banco de Dados
- Schema Prisma com modelos para usuários, trades, estratégias e portfólios
- Suporte a múltiplas contas de trading
- Histórico completo de trades

### Segurança
- Autenticação com NextAuth.js
- Criptografia de dados sensíveis
- Proteção contra ataques comuns

### Performance
- Otimização de imagens com Next.js Image
- Code splitting automático
- Server-side rendering quando necessário

## 📄 Licença

MIT
