"""
Configuration module for MT5 Service.
Loads environment variables and provides configuration settings.
"""

import os
from typing import Optional
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()


class Config:
    """Configuration class for MT5 Service."""
    
    # MetaTrader 5 Credentials
    # Configure estas variáveis no arquivo .env
    MT5_LOGIN: Optional[int] = None
    MT5_PASSWORD: Optional[str] = None
    MT5_SERVER: Optional[str] = None
    
    @classmethod
    def _load_mt5_credentials(cls) -> None:
        """Load and validate MT5 credentials from environment variables."""
        login_str = os.getenv("MT5_LOGIN")
        if login_str:
            try:
                cls.MT5_LOGIN = int(login_str)
            except ValueError:
                cls.MT5_LOGIN = None
                print(f"⚠️  MT5_LOGIN deve ser um número inteiro, recebido: {login_str}")
        
        cls.MT5_PASSWORD = os.getenv("MT5_PASSWORD")
        cls.MT5_SERVER = os.getenv("MT5_SERVER")
    
    # WebSocket Server Configuration
    WS_PORT: int = int(os.getenv("WS_PORT", "8765"))
    WS_HOST: str = os.getenv("WS_HOST", "0.0.0.0")
    
    # Logging Configuration
    LOG_LEVEL: str = os.getenv("LOG_LEVEL", "INFO")
    LOG_FILE: str = os.getenv("LOG_FILE", "mt5_service.log")
    
    # Data Configuration
    CACHE_TTL_SECONDS: int = int(os.getenv("CACHE_TTL_SECONDS", "300"))
    MAX_CANDLES: int = int(os.getenv("MAX_CANDLES", "1000"))
    
    # MT5 Connection Settings
    MT5_TIMEOUT: int = 10000  # milliseconds
    MT5_RETRY_ATTEMPTS: int = 3
    MT5_RETRY_DELAY: int = 5  # seconds
    
    # WebSocket Settings
    WS_PING_TIMEOUT: int = 60  # seconds
    WS_PING_INTERVAL: int = 25  # seconds
    WS_MAX_SIZE: int = 10 * 1024 * 1024  # 10MB
    
    # Data Processing Settings
    DEFAULT_TIMEFRAME: str = "M5"  # 5 minutes
    SUPPORTED_TIMEFRAMES: list = ["M1", "M5", "M15", "M30", "H1", "H4", "D1", "W1", "MN1"]
    
    # Symbols to monitor by default
    DEFAULT_SYMBOLS: list = [
        "EURUSD",
        "GBPUSD", 
        "USDJPY",
        "BTCUSD",
        "ETHUSD",
        "XAUUSD"
    ]
    
    @classmethod
    def validate(cls) -> bool:
        """
        Validate configuration.
        
        Returns:
            bool: True if configuration is valid, False otherwise.
        """
        # Carregar credenciais antes de validar
        cls._load_mt5_credentials()
        
        errors = []
        
        # Validar credenciais MT5
        if not cls.MT5_LOGIN or cls.MT5_LOGIN <= 0:
            errors.append("MT5_LOGIN deve ser um número inteiro positivo (configure no .env)")
        
        if not cls.MT5_PASSWORD:
            errors.append("MT5_PASSWORD deve ser configurado (configure no .env)")
        elif cls.MT5_PASSWORD == "your_password":
            errors.append("MT5_PASSWORD não pode ser o valor padrão 'your_password'")
        
        if not cls.MT5_SERVER:
            errors.append("MT5_SERVER deve ser configurado (configure no .env)")
        elif cls.MT5_SERVER == "MetaQuotes-Demo":
            print("⚠️  Usando servidor demo do MT5. Para trading real, configure um servidor real.")
        
        # Validar configurações do WebSocket
        if cls.WS_PORT <= 0 or cls.WS_PORT > 65535:
            errors.append(f"WS_PORT deve estar entre 1 e 65535, recebido: {cls.WS_PORT}")
        
        # Validar configurações de logging
        valid_log_levels = ["DEBUG", "INFO", "WARNING", "ERROR", "CRITICAL"]
        if cls.LOG_LEVEL not in valid_log_levels:
            errors.append(f"LOG_LEVEL deve ser um dos: {', '.join(valid_log_levels)}")
        
        if errors:
            print("❌ Erros de configuração:")
            for error in errors:
                print(f"  - {error}")
            print("\n📋 Configure as variáveis no arquivo .env:")
            print("   MT5_LOGIN=seu_login")
            print("   MT5_PASSWORD=sua_senha")
            print("   MT5_SERVER=seu_servidor")
            return False
        
        return True
    
    @classmethod
    def print_config(cls) -> None:
        """Print current configuration (without sensitive data)."""
        # Carregar credenciais antes de imprimir
        cls._load_mt5_credentials()
        
        print("⚙️  Configuração do Serviço MT5:")
        print(f"  MT5 Login: {'✅ Configurado' if cls.MT5_LOGIN else '❌ Não configurado'}")
        print(f"  MT5 Server: {cls.MT5_SERVER or '❌ Não configurado'}")
        print(f"  Host WebSocket: {cls.WS_HOST}")
        print(f"  Porta WebSocket: {cls.WS_PORT}")
        print(f"  Nível de Log: {cls.LOG_LEVEL}")
        print(f"  TTL do Cache: {cls.CACHE_TTL_SECONDS}s")
        print(f"  Símbolos padrão: {', '.join(cls.DEFAULT_SYMBOLS)}")
        print(f"  Tentativas de reconexão: {cls.MT5_RETRY_ATTEMPTS}")
        print(f"  Timeout MT5: {cls.MT5_TIMEOUT}ms")


# Create global config instance
config = Config()
