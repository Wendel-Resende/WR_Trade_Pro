# MT5 Service - WR Trading Pro

Serviço Python para integração com MetaTrader 5, fornecendo dados de trading em tempo real via WebSocket.

## 📋 Funcionalidades

- **Conexão MT5**: Conexão segura com terminal MetaTrader 5
- **Dados em Tempo Real**: Ticks, candles, book de ofertas
- **WebSocket API**: Interface real-time para clientes
- **Processamento de Dados**: Indicadores técnicos (SMA, EMA, RSI, MACD)
- **Cache Inteligente**: Otimização de performance
- **Reconexão Automática**: Tolerância a falhas de conexão
- **Health Check**: Monitoramento de saúde do serviço

## 🏗️ Estrutura do Projeto

```
backend/
├── mt5_service/
│   ├── __init__.py          # Pacote principal
│   ├── config.py            # Configurações
│   ├── mt5_connector.py     # Conexão MT5
│   ├── data_processor.py    # Processamento de dados
│   ├── websocket_server.py  # Servidor WebSocket
│   └── main.py              # Ponto de entrada
├── requirements.txt         # Dependências
└── .env.example            # Variáveis de ambiente
```

## 🚀 Instalação

1. **Instalar dependências:**
   ```bash
   pip install -r requirements.txt
   ```

2. **Configurar variáveis de ambiente:**
   ```bash
   cp .env.example .env
   # Editar .env com suas credenciais MT5
   ```

3. **Instalar MetaTrader 5:**
   - Baixe e instale o terminal MT5
   - Configure sua conta demo ou real
   - Mantenha o terminal aberto

## ⚙️ Configuração

Edite o arquivo `.env`:

```env
# MetaTrader 5 Credentials
MT5_LOGIN=12345678
MT5_PASSWORD=your_password
MT5_SERVER=MetaQuotes-Demo

# WebSocket Server Configuration
WS_PORT=8765
WS_HOST=0.0.0.0

# Logging Configuration
LOG_LEVEL=INFO
LOG_FILE=mt5_service.log

# Data Configuration
CACHE_TTL_SECONDS=300
MAX_CANDLES=1000
```

## 🎯 Uso

### Iniciar o serviço:
```bash
cd backend/mt5_service
python -m main
```

### Testar conexão:
```bash
# Health check HTTP
curl http://localhost:8765/health

# Health check WebSocket
# Conectar via cliente Socket.IO
```

### Cliente WebSocket (JavaScript):
```javascript
import { io } from 'socket.io-client';

const socket = io('http://localhost:8765');

// Eventos disponíveis
socket.on('connected', (data) => {
  console.log('Conectado:', data);
});

socket.on('tick', (data) => {
  console.log('Tick:', data);
});

socket.on('candles', (data) => {
  console.log('Candles:', data);
});

// Subscribir a símbolo
socket.emit('subscribe', {
  symbol: 'EURUSD',
  timeframe: 'M5'
});

// Obter candles
socket.emit('get_candles', {
  symbol: 'EURUSD',
  timeframe: 'H1',
  count: 100
});

// Obter info da conta
socket.emit('get_account_info');
```

## 📡 API WebSocket

### Eventos do Cliente:
- `subscribe`: Subscribir a símbolo
- `unsubscribe`: Cancelar subscription
- `get_symbols`: Listar símbolos disponíveis
- `get_candles`: Obter candles históricos
- `get_order_book`: Obter book de ofertas
- `get_account_info`: Obter info da conta
- `ping`: Health check

### Eventos do Servidor:
- `connected`: Conexão estabelecida
- `tick`: Atualização de tick
- `candles`: Dados de candles
- `order_book`: Book de ofertas
- `account_info`: Info da conta
- `account_update`: Atualização da conta
- `market_summary`: Resumo do mercado
- `health`: Status do serviço
- `subscribed`: Subscription confirmada
- `unsubscribed`: Unsubscription confirmada
- `symbols`: Lista de símbolos
- `indicators`: Indicadores técnicos
- `error`: Erro ocorrido

## 🔧 Desenvolvimento

### Estrutura de Código:

1. **MT5Connector**: Gerencia conexão com MT5
   - Conexão/desconexão
   - Recuperação de dados
   - Subscription a ticks

2. **DataProcessor**: Processamento de dados
   - Formatação para JSON
   - Cálculo de indicadores
   - Cache inteligente

3. **WebSocketServer**: Servidor real-time
   - Gerenciamento de clientes
   - Broadcast de dados
   - Rooms por símbolo

4. **MT5Service**: Serviço principal
   - Inicialização
   - Graceful shutdown
   - Health checks

### Adicionar Novo Indicador:

```python
# Em data_processor.py
def calculate_new_indicator(self, prices: List[float], period: int) -> float:
    """Calcular novo indicador técnico."""
    # Implementação do indicador
    pass
```

## 🧪 Testes

### Testar Conexão MT5:
```python
from mt5_service import MT5Connector

connector = MT5Connector()
if connector.connect():
    print("Conectado com sucesso!")
    print(f"Conta: {connector.get_account_info()}")
    connector.disconnect()
```

### Testar WebSocket:
```python
# Usar cliente Socket.IO para testar
```

## 🐛 Solução de Problemas

### Problema: Falha na conexão MT5
**Solução:**
1. Verifique se o terminal MT5 está aberto
2. Confirme credenciais no `.env`
3. Teste conexão manual no terminal MT5

### Problema: WebSocket não responde
**Solução:**
1. Verifique se o serviço está rodando
2. Confirme porta `8765` disponível
3. Verifique logs em `mt5_service.log`

### Problema: Dados desatualizados
**Solução:**
1. Verifique conexão MT5
2. Ajuste `CACHE_TTL_SECONDS` no `.env`
3. Reinicie o serviço

## 📊 Monitoramento

### Logs:
```bash
tail -f mt5_service.log
```

### Métricas:
- Clientes conectados
- Símbolos subscritos
- Latência MT5
- Uso de memória

### Health Check:
```bash
curl http://localhost:8765/health
```

## 🔒 Segurança

### Recomendações:
1. **Não exponha o serviço publicamente** sem firewall
2. **Use HTTPS/WSS** em produção
3. **Implemente autenticação** para clientes
4. **Limite rate** por cliente
5. **Valide inputs** do WebSocket

### Variáveis Sensíveis:
- `MT5_PASSWORD`: Armazene em variáveis de ambiente
- `.env`: Não commit no git
- Credenciais: Use contas demo para desenvolvimento

## 📈 Performance

### Otimizações:
- **Cache LRU**: Para dados frequentes
- **Batch updates**: Agrupa broadcasts
- **Connection pooling**: Para MT5
- **Async I/O**: Não bloqueante

### Limites:
- ~1000 símbolos simultâneos
- ~100 clientes WebSocket
- ~10ms latência por tick

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch (`git checkout -b feature/nova-funcionalidade`)
3. Commit suas mudanças (`git commit -am 'Add nova funcionalidade'`)
4. Push para a branch (`git push origin feature/nova-funcionalidade`)
5. Crie um Pull Request

## 📄 Licença

Proprietário - WR Trading Pro

## 📞 Suporte

Para suporte:
1. Verifique logs em `mt5_service.log`
2. Consulte a documentação
3. Abra uma issue no repositório

---

**Nota**: Este serviço requer MetaTrader 5 instalado e rodando. Use apenas para fins educacionais em contas demo.
