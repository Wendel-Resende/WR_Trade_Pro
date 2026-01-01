"""
MT5 Service Package.
Real-time trading data service for MetaTrader 5.
"""

__version__ = "1.0.0"
__author__ = "WR Trading Pro"
__description__ = "Real-time MT5 data service with WebSocket API"

from .config import config
from .mt5_connector import MT5Connector
from .data_processor import DataProcessor
from .websocket_server import WebSocketServer
from .main import MT5Service, main

__all__ = [
    "config",
    "MT5Connector",
    "DataProcessor",
    "WebSocketServer",
    "MT5Service",
    "main"
]
