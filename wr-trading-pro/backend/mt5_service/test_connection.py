#!/usr/bin/env python3
"""
Test script for MT5 connection
Tests connection to MetaTrader 5 using credentials from .env
"""

import os
import sys
import time
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
    from mt5_service.mt5_connector import MT5Connector
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

def format_currency(value: float, currency: str = "USD") -> str:
    """Format currency value"""
    if currency == "USD":
        return f"${value:,.2f}"
    elif currency == "EUR":
        return f"€{value:,.2f}"
    elif currency == "JPY":
        return f"¥{value:,.0f}"
    else:
        return f"{value:,.2f} {currency}"

def test_mt5_connection():
    """Test MT5 connection and basic operations"""
    
    print_header("🔌 Teste de Conexão MT5")
    
    # Create connector
    connector = MT5Connector()
    
    # Test connection
    print_info("Conectando ao MT5...")
    print_info(f"Servidor: {config.MT5_SERVER}")
    print_info(f"Login: {config.MT5_LOGIN}")
    
    try:
        if connector.connect():
            print_success("Conectado com sucesso ao MT5!")
        else:
            print_error("Falha na conexão com MT5")
            print("\n🔍 Solução de Problemas:")
            print("1. Verifique se o terminal MT5 está aberto")
            print("2. Confirme as credenciais no arquivo .env")
            print("3. Verifique se a conta está logada no terminal")
            print("4. Teste a conexão manualmente no terminal MT5")
            return False
    except Exception as e:
        print_error(f"Erro na conexão: {e}")
        return False
    
    # Get account info
    print_header("📊 Informações da Conta")
    try:
        account_info = connector.get_account_info()
        if account_info:
            print_info(f"Login: {account_info.get('login', 'N/A')}")
            print_info(f"Servidor: {account_info.get('server', 'N/A')}")
            print_info(f"Nome: {account_info.get('name', 'N/A')}")
            print_info(f"Moeda: {account_info.get('currency', 'N/A')}")
            print_info(f"Alavancagem: 1:{account_info.get('leverage', 'N/A')}")
            print_info(f"Saldo: {format_currency(account_info.get('balance', 0), account_info.get('currency', 'USD'))}")
            print_info(f"Equity: {format_currency(account_info.get('equity', 0), account_info.get('currency', 'USD'))}")
            print_info(f"Margem: {format_currency(account_info.get('margin', 0), account_info.get('currency', 'USD'))}")
            print_info(f"Margem Livre: {format_currency(account_info.get('free_margin', 0), account_info.get('currency', 'USD'))}")
            print_info(f"Nível de Margem: {account_info.get('margin_level', 0):.2f}%")
            print_info(f"Lucro: {format_currency(account_info.get('profit', 0), account_info.get('currency', 'USD'))}")
        else:
            print_warning("Não foi possível obter informações da conta")
    except Exception as e:
        print_error(f"Erro ao obter informações da conta: {e}")
    
    # Get available symbols
    print_header("📈 Símbolos Disponíveis")
    try:
        symbols = connector.get_symbols()
        if symbols:
            print_info(f"Total de símbolos: {len(symbols)}")
            print_info("10 primeiros símbolos:")
            for i, symbol in enumerate(symbols[:10], 1):
                print_info(f"  {i}. {symbol}")
            
            # Get symbol info for first 3 symbols
            for symbol in symbols[:3]:
                try:
                    symbol_info = connector.get_symbol_info(symbol)
                    if symbol_info:
                        print_info(f"\n  📊 {symbol}:")
                        print_info(f"    Bid: {symbol_info.get('bid', 'N/A')}")
                        print_info(f"    Ask: {symbol_info.get('ask', 'N/A')}")
                        print_info(f"    Spread: {symbol_info.get('spread', 'N/A')}")
                        print_info(f"    Volume Mínimo: {symbol_info.get('volume_min', 'N/A')}")
                except Exception as e:
                    print_warning(f"    Erro ao obter info de {symbol}: {e}")
        else:
            print_warning("Não foi possível obter lista de símbolos")
    except Exception as e:
        print_error(f"Erro ao obter símbolos: {e}")
    
    # Test EURUSD tick
    print_header("💹 Último Tick EURUSD")
    try:
        tick = connector.get_current_tick("EURUSD")
        if tick:
            print_info(f"Bid: {tick.get('bid', 'N/A')}")
            print_info(f"Ask: {tick.get('ask', 'N/A')}")
            print_info(f"Last: {tick.get('last', 'N/A')}")
            print_info(f"Spread: {tick.get('spread', 'N/A')}")
            print_info(f"Volume: {tick.get('volume', 'N/A')}")
            
            time_str = tick.get('time', '')
            if time_str:
                if isinstance(time_str, str):
                    print_info(f"Time: {time_str}")
                else:
                    # Try to format datetime
                    try:
                        dt = datetime.fromtimestamp(time_str)
                        print_info(f"Time: {dt.strftime('%Y-%m-%d %H:%M:%S')}")
                    except:
                        print_info(f"Time: {time_str}")
        else:
            print_warning("Não foi possível obter tick do EURUSD")
    except Exception as e:
        print_error(f"Erro ao obter tick EURUSD: {e}")
    
    # Test EURUSD candles
    print_header("📊 Candles EURUSD (H1)")
    try:
        candles = connector.get_candles("EURUSD", "H1", 10)
        if candles and len(candles) > 0:
            print_info(f"Total de candles: {len(candles)}")
            print_info("Últimos 5 candles:")
            
            for i, candle in enumerate(candles[-5:], 1):
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
                print_info(f"    V: {candle.get('tick_volume', 'N/A'):.0f}")
        else:
            print_warning("Não foi possível obter candles do EURUSD")
    except Exception as e:
        print_error(f"Erro ao obter candles EURUSD: {e}")
    
    # Test order book (simulated)
    print_header("📈 Order Book EURUSD (Simulado)")
    try:
        order_book = connector.get_order_book("EURUSD")
        if order_book:
            print_info(f"Symbol: {order_book.get('symbol', 'N/A')}")
            print_info(f"Time: {order_book.get('time', 'N/A')}")
            print_info(f"Spread: {order_book.get('spread', 'N/A')}")
            print_info(f"Mid Price: {order_book.get('mid_price', 'N/A')}")
            
            bids = order_book.get('bids', [])
            asks = order_book.get('asks', [])
            
            print_info(f"Bids: {len(bids)} níveis")
            if bids:
                print_info("  Top 3 bids:")
                for i, bid in enumerate(bids[:3], 1):
                    print_info(f"    {i}. Price: {bid.get('price', 'N/A'):.5f}, Volume: {bid.get('volume', 'N/A'):.2f}")
            
            print_info(f"Asks: {len(asks)} níveis")
            if asks:
                print_info("  Top 3 asks:")
                for i, ask in enumerate(asks[:3], 1):
                    print_info(f"    {i}. Price: {ask.get('price', 'N/A'):.5f}, Volume: {ask.get('volume', 'N/A'):.2f}")
        else:
            print_warning("Não foi possível obter order book do EURUSD")
    except Exception as e:
        print_error(f"Erro ao obter order book EURUSD: {e}")
    
    # Disconnect
    print_header("🔌 Finalizando Conexão")
    try:
        connector.disconnect()
        print_success("Desconectado do MT5 com sucesso!")
    except Exception as e:
        print_error(f"Erro ao desconectar: {e}")
    
    return True

def main():
    """Main function"""
    print_header("🚀 Iniciando Teste de Conexão MT5")
    print_info(f"Python: {sys.version}")
    print_info(f"Diretório: {os.getcwd()}")
    print_info(f"Hora: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    # Check if .env exists
    env_file = Path(__file__).parent.parent / ".env"
    if env_file.exists():
        print_success(f"Arquivo .env encontrado: {env_file}")
    else:
        print_warning(f"Arquivo .env não encontrado: {env_file}")
        print_info("Usando .env.example ou variáveis de ambiente")
    
    # Run tests
    start_time = time.time()
    success = test_mt5_connection()
    elapsed_time = time.time() - start_time
    
    print_header("📊 Resumo do Teste")
    if success:
        print_success(f"✅ TESTE CONCLUÍDO COM SUCESSO!")
    else:
        print_error(f"❌ TESTE FALHOU!")
    
    print_info(f"⏱️  Tempo total: {elapsed_time:.2f} segundos")
    
    return 0 if success else 1

if __name__ == "__main__":
    try:
        exit_code = main()
        sys.exit(exit_code)
    except KeyboardInterrupt:
        print("\n\n⚠️  Teste interrompido pelo usuário")
        sys.exit(130)
    except Exception as e:
        print_error(f"Erro não tratado: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
