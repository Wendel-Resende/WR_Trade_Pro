# Indicadores Técnicos

Biblioteca de indicadores técnicos para análise quantitativa em trading.

## Instalação

```bash
# Já incluído no projeto
npm install
```

## Uso

### Importação

```typescript
// Importar funções específicas
import { calculateSMA, calculateRSI, calculateMACD } from './lib/indicators';

// Importar utilitários
import { IndicatorUtils, DefaultIndicatorConfigs } from './lib/indicators';

// Importar tudo
import * as Indicators from './lib/indicators';
```

### Exemplos

#### Simple Moving Average (SMA)

```typescript
import { calculateSMA } from './lib/indicators';

const prices = [100, 102, 101, 103, 105, 104, 106];
const sma = calculateSMA(prices, 3);
// Resultado: [null, null, 101, 102, 103, 104, 105]
```

#### Relative Strength Index (RSI)

```typescript
import { calculateRSI } from './lib/indicators';

const prices = [100, 102, 101, 103, 105, 104, 106];
const rsi = calculateRSI(prices, 14);
// Valores entre 0 e 100
```

#### MACD

```typescript
import { calculateMACD } from './lib/indicators';

const prices = Array.from({ length: 50 }, (_, i) => 100 + Math.sin(i * 0.1) * 10);
const { macd, signal, histogram } = calculateMACD(prices);
```

#### Utilitários

```typescript
import { IndicatorUtils } from './lib/indicators';

// Normalizar preços
const normalized = IndicatorUtils.normalizePrices([null, 100, null, 102]);
// Resultado: [100, 102]

// Gerar sinais de crossover
const fastMA = [null, null, 101, 102, 103];
const slowMA = [null, null, 100, 101, 102];
const signals = IndicatorUtils.generateSignalFromCrossover(fastMA, slowMA);
// Resultado: [null, null, null, 'BUY', 'HOLD']
```

## API

### Funções Principais

#### `calculateSMA(prices: number[], period: number): (number | null)[]`
Calcula a média móvel simples.

#### `calculateEMA(prices: number[], period: number): (number | null)[]`
Calcula a média móvel exponencial.

#### `calculateRSI(prices: number[], period?: number): (number | null)[]`
Calcula o índice de força relativa (padrão: período 14).

#### `calculateMACD(prices: number[]): { macd: (number | null)[], signal: (number | null)[], histogram: (number | null)[] }`
Calcula o MACD com períodos padrão (12, 26, 9).

#### `calculateBollingerBands(prices: number[], period?: number, stdDev?: number): { upper: (number | null)[], middle: (number | null)[], lower: (number | null)[] }`
Calcula as bandas de Bollinger (padrão: período 20, desvio padrão 2).

#### `calculateATR(high: number[], low: number[], close: number[], period?: number): (number | null)[]`
Calcula o average true range (padrão: período 14).

#### `calculateStochastic(high: number[], low: number[], close: number[], period?: number): { k: (number | null)[], d: (number | null)[] }`
Calcula o oscilador estocástico (padrão: período 14).

#### `calculateAllIndicators(prices: number[]): object`
Calcula múltiplos indicadores de uma vez.

### Utilitários

#### `IndicatorUtils.normalizePrices(prices: (number | null)[]): number[]`
Remove valores null de uma série de preços.

#### `IndicatorUtils.calculateReturn(initial: number, final: number): number`
Calcula retorno percentual.

#### `IndicatorUtils.generateSignalFromCrossover(fastMA: (number | null)[], slowMA: (number | null)[]): ('BUY' | 'SELL' | 'HOLD' | null)[]`
Gera sinais de compra/venda baseados em crossover de médias móveis.

#### `IndicatorUtils.detectDivergence(prices: number[], indicator: (number | null)[], lookback?: number): { type: 'BULLISH' | 'BEARISH' | null, index: number }[]`
Detecta divergências entre preço e indicador.

### Configurações Padrão

```typescript
import { DefaultIndicatorConfigs } from './lib/indicators';

console.log(DefaultIndicatorConfigs.SMA.short); // 20
console.log(DefaultIndicatorConfigs.RSI.overbought); // 70
```

## Testes

```bash
# Executar testes
npm test -- lib/indicators/technical.test.ts

# Executar todos os testes
npm test
```

## Características

- ✅ Tipagem TypeScript completa
- ✅ Validação de inputs rigorosa
- ✅ Tratamento de valores null para períodos insuficientes
- ✅ Performance otimizada para grandes datasets
- ✅ Testes unitários abrangentes
- ✅ Documentação JSDoc detalhada
- ✅ Utilitários para análise técnica

## Validação

A biblioteca inclui validação robusta de inputs:

```typescript
// Lança erro para array vazio
calculateSMA([], 3); // Error: SMA: array de preços vazio

// Lança erro para período inválido
calculateSMA([100, 102], 3); // Error: SMA: período (3) maior que tamanho do array (2)

// Lança erro para valores não numéricos
calculateSMA([100, NaN, 102], 2); // Error: SMA: preço inválido na posição 1: NaN

// Lança erro para Infinity/NaN
calculateSMA([100, Infinity, 102], 2); // Error: SMA: preço inválido na posição 1: Infinity
```

## Performance

A biblioteca é otimizada para performance:

```typescript
// Teste de performance com 1000 preços
const largePrices = Array.from({ length: 1000 }, (_, i) => 100 + Math.sin(i * 0.1) * 10);

const start = performance.now();
const sma = calculateSMA(largePrices, 20);
const ema = calculateEMA(largePrices, 20);
const rsi = calculateRSI(largePrices, 14);
const end = performance.now();

console.log(`Executado em ${end - start}ms`); // < 100ms
```

## Contribuição

1. Faça suas alterações
2. Adicione testes
3. Execute `npm test`
4. Atualize a documentação
5. Envie um pull request

## Licença

MIT
