#!/usr/bin/env python3
"""
Teste rápido para BTCUSD
"""

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

try:
    from mt5_connector import MT5Connector
    from config import config
    
    print("🔍 Verificando símbolos BTC...")
    
    mt5 = MT5Connector()
    
    # Conectar ao MT5
    if not mt5.is_connected():
