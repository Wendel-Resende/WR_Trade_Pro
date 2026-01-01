#!/usr/bin/env python3
"""
Test script for WebSocket server
Tests all WebSocket events and functionality
"""

import os
import sys
import time
import threading
import asyncio
import json
from datetime import datetime
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

try:
    from colorama import init, Fore, Style
    init(autoreset=True)
    HAS_COLORAMA = True
except ImportError:
    HAS_COLORAMA = False
    print("⚠️  colorama não instalado. Instale com: pip install colorama")
    # Define fallback colors
    class Fore:
        GREEN = YELLOW = BLUE = RED = CYAN = MAGENTA = RESET = ''
    class Style:
        BRIGHT = RESET_ALL = ''

try:
    import socketio
    import websockets
    HAS_WEBSOCKET_LIBS = True
except ImportError:
    HAS_WEBSOCKET_LIBS = False
    print("⚠️  Bibliotecas WebSocket não instaladas.")
    print("Instale com: pip install python-socketio websockets")

try:
    from mt5_service.websocket_server import WebSocketServer
    from mt5_service.config import config
except ImportError as e:
    print(f"{Fore.RED}❌ Erro ao importar módulos: {e}")
    print(f"{Fore.YELLOW}Execute este script do diretório backend/")
    sys.exit(1)

def print_success(message: str):
    """Print success message with green color"""
    if HAS_COLORAMA:
        print(f"{Fore.GREEN}✅ {message}")
    else:
        print(f"✅ {message}")

def print_error(message: str):
    """Print error message with red color"""
    if HAS_COLORAMA:
        print(f"{Fore.RED}❌ {message}")
    else:
        print(f"❌ {message}")

def print_info(message: str):
    """Print info message with blue color"""
    if HAS_COLORAMA:
        print(f"{Fore.BLUE}ℹ️  {message}")
    else:
        print(f"ℹ️  {message}")

def print_warning(message: str):
    """Print warning message with yellow color"""
    if HAS_COLORAMA:
        print(f"{Fore.YELLOW}⚠️  {message}")
    else:
        print(f"⚠️  {message}")

def print_header(message: str):
    """Print header with cyan color"""
    if HAS_COLORAMA:
        print(f"\n{Fore.CYAN}{Style.BRIGHT}{message}{Style.RESET_ALL}")
        print(f"{Fore.CYAN}{'=' * len(message)}{Style.RESET_ALL}")
    else:
        print(f"\n{message}")
        print("=" * len(message))

def print_test_result(test_name: str, success: bool, message: str = ""):
    """Print test result"""
    if success:
        print_success(f"{test_name}: {message}")
    else:
        print_error(f"{test_name}: {message}")

class WebSocketTestClient:
    """WebSocket test client"""
    
    def __init__(self, url: str = "http://localhost:8765"):
        self.url = url
        self.sio = socketio.Client()
        self.connected = False
        self.received_events = {}
        self.received_ticks = []
        self.test_results = {}
        
        # Setup event handlers
        self.setup_handlers()
    
    def setup_handlers(self):
        """Setup Socket.IO event handlers"""
        
        @self.sio.event
        def connect():
            self.connected = True
            self.received_events['connected'] = True
        
        @self.sio.event
        def disconnect():
            self.connected = False
            self.received_events['disconnected'] = True
        
        @self.sio.event
        def connected(data):
            self.received_events['connected_event'] = data
        
        @self.sio.event
        def tick(data):
            self.received_ticks.append(data)
            self.received_events['tick'] = self.received_events.get('tick', 0) + 1
        
        @self.sio.event
        def candles(data):
            self.received_events['candles'] = data
        
        @self.sio.event
        def order_book(data):
            self.received_events['order_book'] = data
        
        @self.sio.event
        def account_info(data):
            self.received_events['account_info'] = data
        
        @self.sio.event
        def symbols(data):
            self.received_events['symbols'] = data
        
        @self.sio.event
        def subscribed(data):
            self.received_events['subscribed'] = data
        
        @self.sio.event
        def unsubscribed(data):
            self.received_events['unsubscribed'] = data
        
        @self.sio.event
        def health(data):
            self.received_events['health'] = data
        
        @self.sio.event
        def error(data):
            self.received_events['error'] = data
    
    def connect(self, timeout: int = 5) -> bool:
        """Connect to WebSocket server"""
        try:
            self.sio.connect(self.url, wait_timeout=timeout)
            return self.connected
        except Exception as e:
            print_error(f"Erro na conexão: {e}")
            return False
    
    def disconnect(self):
        """Disconnect from WebSocket server"""
        if self.connected:
            self.sio.disconnect()
    
    def wait_for_event(self, event_name: str, timeout: int = 5) -> bool:
        """Wait for specific event"""
        start_time = time.time()
        while time.time() - start_time < timeout:
            if event_name in self.received_events:
                return True
            time.sleep(0.1)
        return False
    
    def clear_events(self):
        """Clear received events"""
        self.received_events.clear()
        self.received_ticks.clear()

def start_websocket_server():
    """Start WebSocket server in a separate thread"""
    print_info("🚀 Iniciando WebSocket Server...")
    
    try:
        from mt5_service.mt5_connector import MT5Connector
        from mt5_service.data_processor import DataProcessor
        
        # Create MT5 connector and data processor
        mt5_connector = MT5Connector()
        data_processor = DataProcessor()
        
        # Create WebSocket server
        server = WebSocketServer(mt5_connector, data_processor)
        
        def run_server():
            asyncio.run(server.start())
        
        server_thread = threading.Thread(target=run_server, daemon=True)
        server_thread.start()
        
        # Wait for server to start
        time.sleep(2)
        
        return server, server_thread
    except Exception as e:
        print_error(f"Erro ao iniciar servidor WebSocket: {e}")
        return None, None

def test_websocket_connection():
    """Test WebSocket connection"""
    print_header("🧪 Teste 1: Conexão WebSocket")
    
    client = WebSocketTestClient()
    
    try:
        connected = client.connect(timeout=5)
        if connected:
            print_success("Cliente conectado com sucesso!")
            return client, True
        else:
            print_error("Falha na conexão do cliente")
            return None, False
    except Exception as e:
        print_error(f"Erro na conexão: {e}")
        return None, False

def test_subscribe(client: WebSocketTestClient) -> bool:
    """Test subscribe to symbol"""
    print_header("🧪 Teste 2: Subscribe BTCUSD")
    
    client.clear_events()
    
    try:
        # Subscribe to BTCUSD
        client.sio.emit('subscribe', {'symbol': 'BTCUSD', 'timeframe': 'M5'})
        
        # Wait for subscribed event
        if client.wait_for_event('subscribed', timeout=5):
            subscribed_data = client.received_events.get('subscribed', {})
            print_success(f"Subscribed com sucesso: {subscribed_data}")
            return True
        else:
            print_error("Timeout aguardando evento 'subscribed'")
            return False
    except Exception as e:
        print_error(f"Erro no subscribe: {e}")
        return False

def test_receive_ticks(client: WebSocketTestClient) -> bool:
    """Test receiving ticks"""
    print_header("🧪 Teste 3: Receber Ticks")
    
    client.clear_events()
    
    try:
        # Wait for ticks (up to 10 seconds for 5 ticks)
        max_wait = 10
        start_time = time.time()
        
        while time.time() - start_time < max_wait:
            tick_count = client.received_events.get('tick', 0)
            if tick_count >= 5:
                break
            time.sleep(0.5)
        
        tick_count = client.received_events.get('tick', 0)
        if tick_count >= 5:
            print_success(f"Recebidos {tick_count} ticks")
            
            # Show first 3 ticks
            for i, tick in enumerate(client.received_ticks[:3], 1):
                if 'symbol' in tick and 'tick' in tick:
                    tick_data = tick['tick']
                    print_info(f"  Tick {i}: {tick['symbol']} @ {tick_data.get('bid', 'N/A')}")
            
            return True
        else:
            print_error(f"Apenas {tick_count} ticks recebidos (esperado: 5)")
            return False
    except Exception as e:
        print_error(f"Erro ao receber ticks: {e}")
        return False

def test_get_symbols(client: WebSocketTestClient) -> bool:
    """Test get symbols"""
    print_header("🧪 Teste 4: Get Symbols")
    
    client.clear_events()
    
    try:
        # Request symbols
        client.sio.emit('get_symbols', {})
        
        # Wait for symbols event
        if client.wait_for_event('symbols', timeout=5):
            symbols_data = client.received_events.get('symbols', {})
            symbols = symbols_data.get('symbols', [])
            count = symbols_data.get('count', 0)
            
            print_success(f"Recebidos {count} símbolos")
            
            if symbols:
                print_info("10 primeiros símbolos:")
                for i, symbol in enumerate(symbols[:10], 1):
                    print_info(f"  {i}. {symbol}")
            
            return True
        else:
            print_error("Timeout aguardando evento 'symbols'")
            return False
    except Exception as e:
        print_error(f"Erro ao obter símbolos: {e}")
        return False

def test_get_candles(client: WebSocketTestClient) -> bool:
    """Test get candles"""
    print_header("🧪 Teste 5: Get Candles")
    
    client.clear_events()
    
    try:
        # Request candles
        client.sio.emit('get_candles', {
            'symbol': 'BTCUSD',
            'timeframe': 'H1',
            'count': 10
        })
        
        # Wait for candles event
        if client.wait_for_event('candles', timeout=5):
            candles_data = client.received_events.get('candles', {})
            candles = candles_data.get('candles', [])
            count = candles_data.get('count', 0)
            
            print_success(f"Recebidos {count} candles")
            
            if candles:
                print_info("Últimos 3 candles:")
                for i, candle in enumerate(candles[-3:], 1):
                    time_str = candle.get('time', '')
                    if isinstance(time_str, str):
                        time_display = time_str
                    else:
                        try:
                            dt = datetime.fromtimestamp(time_str)
                            time_display = dt.strftime('%Y-%m-%d %H:%M')
                        except:
                            time_display = str(time_str)
                    
                    print_info(f"  [{time_display}]")
                    print_info(f"    O: {candle.get('open', 'N/A'):.5f}")
                    print_info(f"    H: {candle.get('high', 'N/A'):.5f}")
                    print_info(f"    L: {candle.get('low', 'N/A'):.5f}")
                    print_info(f"    C: {candle.get('close', 'N/A'):.5f}")
            
            return True
        else:
            print_error("Timeout aguardando evento 'candles'")
            return False
    except Exception as e:
        print_error(f"Erro ao obter candles: {e}")
        return False

def test_get_order_book(client: WebSocketTestClient) -> bool:
    """Test get order book"""
    print_header("🧪 Teste 6: Order Book")
    
    client.clear_events()
    
    try:
        # Request order book
        client.sio.emit('get_order_book', {
            'symbol': 'BTCUSD',
            'depth': 10
        })
        
        # Wait for order_book event
        if client.wait_for_event('order_book', timeout=5):
            order_book_data = client.received_events.get('order_book', {})
            order_book = order_book_data.get('order_book', {})
            
            print_success("Order book recebido")
            
            if order_book:
                bids = order_book.get('bids', [])
                asks = order_book.get('asks', [])
                spread = order_book.get('spread', 0)
                
                print_info(f"Spread: {spread:.5f}")
                print_info(f"Bids: {len(bids)} níveis")
                print_info(f"Asks: {len(asks)} níveis")
                
                if bids and asks:
                    print_info("Top bid/ask:")
                    print_info(f"  Bid: {bids[0].get('price', 'N/A'):.5f}")
                    print_info(f"  Ask: {asks[0].get('price', 'N/A'):.5f}")
            
            return True
        else:
            print_error("Timeout aguardando evento 'order_book'")
            return False
    except Exception as e:
        print_error(f"Erro ao obter order book: {e}")
        return False

def test_get_account_info(client: WebSocketTestClient) -> bool:
    """Test get account info"""
    print_header("🧪 Teste 7: Account Info")
    
    client.clear_events()
    
    try:
        # Request account info
        client.sio.emit('get_account_info', {})
        
        # Wait for account_info event
        if client.wait_for_event('account_info', timeout=5):
            account_data = client.received_events.get('account_info', {})
            account = account_data.get('account', {})
            
            print_success("Account info recebido")
            
            if account:
                print_info(f"Login: {account.get('login', 'N/A')}")
                print_info(f"Servidor: {account.get('server', 'N/A')}")
                print_info(f"Saldo: ${account.get('balance', 0):,.2f}")
                print_info(f"Equity: ${account.get('equity', 0):,.2f}")
            
            return True
        else:
            print_error("Timeout aguardando evento 'account_info'")
            return False
    except Exception as e:
        print_error(f"Erro ao obter account info: {e}")
        return False

def test_unsubscribe(client: WebSocketTestClient) -> bool:
    """Test unsubscribe"""
    print_header("🧪 Teste 8: Unsubscribe")
    
    client.clear_events()
    
    try:
        # Unsubscribe from BTCUSD
        client.sio.emit('unsubscribe', {'symbol': 'BTCUSD'})
        
        # Wait for unsubscribed event
        if client.wait_for_event('unsubscribed', timeout=5):
            unsubscribed_data = client.received_events.get('unsubscribed', {})
            print_success(f"Unsubscribed com sucesso: {unsubscribed_data}")
            return True
        else:
            print_error("Timeout aguardando evento 'unsubscribed'")
            return False
    except Exception as e:
        print_error(f"Erro no unsubscribe: {e}")
        return False

def test_health_check(client: WebSocketTestClient) -> bool:
    """Test health check"""
    print_header("🧪 Teste 9: Health Check")
    
    client.clear_events()
    
    try:
        # Send ping
        client.sio.emit('ping', {})
        
        # Wait for health event
        if client.wait_for_event('health', timeout=5):
            health_data = client.received_events.get('health', {})
            print_success(f"Health check: {health_data}")
            return True
        else:
            print_error("Timeout aguardando evento 'health'")
            return False
    except Exception as e:
        print_error(f"Erro no health check: {e}")
        return False

def main():
    """Main test function"""
    print_header("🚀 Iniciando Teste WebSocket")
    print_info(f"Python: {sys.version}")
    print_info(f"Diretório: {os.getcwd()}")
    print_info(f"Hora: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    if not HAS_WEBSOCKET_LIBS:
        print_error("Bibliotecas WebSocket não instaladas.")
        print_info("Instale com: pip install python-socketio websockets")
        return 1
    
    # Start WebSocket server
    server, server_thread = start_websocket_server()
    print_success(f"Server rodando em ws://localhost:{config.WS_PORT}")
    
    # Give server time to initialize
    time.sleep(2)
    
    test_results = {}
    client = None
    
    try:
        # Run all tests
        print_header("🧪 Executando Testes")
        
        # Test 1: Connection
        client, success = test_websocket_connection()
        test_results['connection'] = success
        
        if not success or not client:
            print_error("Teste de conexão falhou. Abortando outros testes.")
            return 1
        
        # Test 2: Subscribe
        test_results['subscribe'] = test_subscribe(client)
        
        # Test 3: Receive ticks
        test_results['receive_ticks'] = test_receive_ticks(client)
        
        # Test 4: Get symbols
        test_results['get_symbols'] = test_get_symbols(client)
        
        # Test 5: Get candles
        test_results['get_candles'] = test_get_candles(client)
        
        # Test 6: Get order book
        test_results['get_order_book'] = test_get_order_book(client)
        
        # Test 7: Get account info
        test_results['get_account_info'] = test_get_account_info(client)
        
        # Test 8: Unsubscribe
        test_results['unsubscribe'] = test_unsubscribe(client)
        
        # Test 9: Health check
        test_results['health_check'] = test_health_check(client)
        
        # Disconnect client
        print_header("🔌 Finalizando Conexão")
        if client:
            client.disconnect()
            print_success("Cliente desconectado")
        
        # Print test summary
        print_header("📊 Resumo dos Testes")
        
        total_tests = len(test_results)
        passed_tests = sum(1 for result in test_results.values() if result)
        failed_tests = total_tests - passed_tests
        
        print_info(f"Total de testes: {total_tests}")
        print_info(f"Testes passados: {passed_tests}")
        print_info(f"Testes falhados: {failed_tests}")
        
        # Print individual test results
        print_header("📋 Resultados Individuais")
        for test_name, result in test_results.items():
            if result:
                print_success(f"{test_name}: PASS")
            else:
                print_error(f"{test_name}: FAIL")
        
        # Final result
        print_header("🎯 Resultado Final")
        if failed_tests == 0:
            print_success("✅ TODOS OS TESTES PASSARAM!")
            return 0
        else:
            print_error(f"❌ {failed_tests} TESTES FALHARAM!")
            return 1
            
    except KeyboardInterrupt:
        print("\n\n⚠️  Teste interrompido pelo usuário")
        if client:
            client.disconnect()
        return 130
    except Exception as e:
        print_error(f"Erro não tratado: {e}")
        import traceback
        traceback.print_exc()
        if client:
            client.disconnect()
        return 1

if __name__ == "__main__":
    exit_code = main()
    sys.exit(exit_code)
