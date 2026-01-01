"""
MetaTrader 5 Connector Module.
Handles connection to MT5 terminal and data retrieval operations.
"""

import time
import logging
from typing import Optional, Dict, List, Any, Callable
from datetime import datetime, timedelta
import MetaTrader5 as mt5
from .config import config


class MT5Connector:
    """MetaTrader 5 connector for trading operations and data retrieval."""
    
    def __init__(self):
        """Initialize MT5 connector."""
        self.logger = logging.getLogger(__name__)
        self.connected = False
        self.account_info = None
        self.subscribed_symbols = {}
        self.tick_callbacks = {}
        self.tick_polling_active = False
        self.tick_polling_interval = 0.5  # Poll every 500ms
        
    def connect(self, login: Optional[int] = None, password: Optional[str] = None, 
                server: Optional[str] = None) -> bool:
        """
        Connect to MetaTrader 5 terminal.
        
        Args:
            login: MT5 account login
            password: MT5 account password
            server: MT5 server name
            
        Returns:
            bool: True if connection successful, False otherwise
        """
        login = login or config.MT5_LOGIN
        password = password or config.MT5_PASSWORD
        server = server or config.MT5_SERVER
        
        self.logger.info(f"Connecting to MT5: login={login}, server={server}")
        
        for attempt in range(config.MT5_RETRY_ATTEMPTS):
            try:
                if not mt5.initialize(login=login, password=password, server=server, 
                                     timeout=config.MT5_TIMEOUT):
                    error = mt5.last_error()
                    self.logger.warning(f"MT5 initialization failed (attempt {attempt + 1}): {error}")
                    
                    if attempt < config.MT5_RETRY_ATTEMPTS - 1:
                        time.sleep(config.MT5_RETRY_DELAY)
                        continue
                    
                    return False
                
                self.connected = True
                self.account_info = mt5.account_info()
                
                if self.account_info is None:
                    self.logger.error("Failed to get account info")
                    mt5.shutdown()
                    self.connected = False
                    return False
                
                self.logger.info(f"Connected to MT5 successfully. Account: {self.account_info.login}")
                self.logger.info(f"Balance: {self.account_info.balance}, Equity: {self.account_info.equity}")
                
                return True
                
            except Exception as e:
                self.logger.error(f"Error connecting to MT5 (attempt {attempt + 1}): {e}")
                if attempt < config.MT5_RETRY_ATTEMPTS - 1:
                    time.sleep(config.MT5_RETRY_DELAY)
        
        return False
    
    def disconnect(self) -> None:
        """Disconnect from MetaTrader 5 terminal."""
        if self.connected:
            mt5.shutdown()
            self.connected = False
            self.account_info = None
            self.subscribed_symbols.clear()
            self.tick_callbacks.clear()
            self.logger.info("Disconnected from MT5")
    
    def is_connected(self) -> bool:
        """
        Check if connected to MT5.
        
        Returns:
            bool: True if connected, False otherwise
        """
        return self.connected and mt5.terminal_info() is not None
    
    def get_account_info(self) -> Optional[Dict[str, Any]]:
        """
        Get account information.
        
        Returns:
            Optional[Dict]: Account information as dictionary, None if not connected
        """
        if not self.is_connected():
            self.logger.error("Not connected to MT5")
            return None
        
        try:
            account = mt5.account_info()
            if account is None:
                return None
            
            return {
                "login": account.login,
                "balance": account.balance,
                "equity": account.equity,
                "margin": account.margin,
                "free_margin": account.margin_free,
                "margin_level": account.margin_level,
                "currency": account.currency,
                "leverage": account.leverage,
                "name": account.name,
                "server": account.server,
                "profit": account.profit
            }
        except Exception as e:
            self.logger.error(f"Error getting account info: {e}")
            return None
    
    def get_symbol_info(self, symbol: str) -> Optional[Dict[str, Any]]:
        """
        Get symbol information.
        
        Args:
            symbol: Trading symbol (e.g., "EURUSD")
            
        Returns:
            Optional[Dict]: Symbol information as dictionary, None if error
        """
        if not self.is_connected():
            self.logger.error("Not connected to MT5")
            return None
        
        try:
            info = mt5.symbol_info(symbol)
            if info is None:
                self.logger.error(f"Symbol {symbol} not found")
                return None
            
            return {
                "symbol": info.name,
                "bid": info.bid,
                "ask": info.ask,
                "last": info.last,
                "volume": info.volume,
                "spread": info.spread,
                "digits": info.digits,
                "point": info.point,
                "trade_mode": info.trade_mode,
                "trade_contract_size": info.trade_contract_size,
                "trade_tick_size": info.trade_tick_size,
                "trade_tick_value": info.trade_tick_value,
                "trade_stops_level": info.trade_stops_level,
                "trade_freeze_level": info.trade_freeze_level
            }
        except Exception as e:
            self.logger.error(f"Error getting symbol info for {symbol}: {e}")
            return None
    
    def get_current_tick(self, symbol: str) -> Optional[Dict[str, Any]]:
        """
        Get current tick for a symbol.
        
        Args:
            symbol: Trading symbol
            
        Returns:
            Optional[Dict]: Current tick data, None if error
        """
        if not self.is_connected():
            self.logger.error("Not connected to MT5")
            return None
        
        try:
            tick = mt5.symbol_info_tick(symbol)
            if tick is None:
                return None
            
            return {
                "symbol": symbol,
                "time": tick.time,
                "bid": tick.bid,
                "ask": tick.ask,
                "last": tick.last,
                "volume": tick.volume,
                "time_msc": tick.time_msc,
                "flags": tick.flags
            }
        except Exception as e:
            self.logger.error(f"Error getting tick for {symbol}: {e}")
            return None
    
    def get_candles(self, symbol: str, timeframe: str = "M5", count: int = 100) -> Optional[List[Dict[str, Any]]]:
        """
        Get historical candles for a symbol.
        
        Args:
            symbol: Trading symbol
            timeframe: Timeframe string (M1, M5, M15, M30, H1, H4, D1, W1, MN1)
            count: Number of candles to retrieve
            
        Returns:
            Optional[List[Dict]]: List of candle data, None if error
        """
        if not self.is_connected():
            self.logger.error("Not connected to MT5")
            return None
        
        # Map timeframe string to MT5 constant
        timeframe_map = {
            "M1": mt5.TIMEFRAME_M1,
            "M5": mt5.TIMEFRAME_M5,
            "M15": mt5.TIMEFRAME_M15,
            "M30": mt5.TIMEFRAME_M30,
            "H1": mt5.TIMEFRAME_H1,
            "H4": mt5.TIMEFRAME_H4,
            "D1": mt5.TIMEFRAME_D1,
            "W1": mt5.TIMEFRAME_W1,
            "MN1": mt5.TIMEFRAME_MN1
        }
        
        if timeframe not in timeframe_map:
            self.logger.error(f"Unsupported timeframe: {timeframe}")
            return None
        
        try:
            mt5_timeframe = timeframe_map[timeframe]
            rates = mt5.copy_rates_from_pos(symbol, mt5_timeframe, 0, count)
            
            if rates is None:
                return None
            
            candles = []
            for rate in rates:
                candles.append({
                    "time": datetime.fromtimestamp(rate["time"]).isoformat(),
                    "open": rate["open"],
                    "high": rate["high"],
                    "low": rate["low"],
                    "close": rate["close"],
                    "tick_volume": rate["tick_volume"],
                    "spread": rate["spread"],
                    "real_volume": rate["real_volume"]
                })
            
            return candles
            
        except Exception as e:
            self.logger.error(f"Error getting candles for {symbol}: {e}")
            return None
    
    def get_order_book(self, symbol: str, depth: int = 10) -> Optional[Dict[str, Any]]:
        """
        Get order book for a symbol.
        
        Args:
            symbol: Trading symbol
            depth: Depth of order book
            
        Returns:
            Optional[Dict]: Order book data, None if error or not supported
        """
        if not self.is_connected():
            self.logger.error("Not connected to MT5")
            return None
        
        try:
            # Note: MT5 doesn't have direct order book API for all symbols
            # This is a simplified implementation
            tick = self.get_current_tick(symbol)
            if tick is None:
                return None
            
            # Simulate order book based on current price
            bid = tick["bid"]
            ask = tick["ask"]
            spread = ask - bid
            
            bids = []
            asks = []
            
            for i in range(depth):
                bid_price = bid - (spread * i * 0.1)
                ask_price = ask + (spread * i * 0.1)
                
                bids.append({
                    "price": bid_price,
                    "volume": 1000 * (depth - i) / depth
                })
                
                asks.append({
                    "price": ask_price,
                    "volume": 1000 * (depth - i) / depth
                })
            
            return {
                "symbol": symbol,
                "time": datetime.now().isoformat(),
                "bids": bids,
                "asks": asks,
                "spread": spread
            }
            
        except Exception as e:
            self.logger.error(f"Error getting order book for {symbol}: {e}")
            return None
    
    def subscribe_ticks(self, symbol: str, callback: Callable[[Dict[str, Any]], None]) -> bool:
        """
        Subscribe to tick updates for a symbol.
        
        Args:
            symbol: Trading symbol
            callback: Function to call when new tick arrives
            
        Returns:
            bool: True if subscription successful, False otherwise
        """
        if not self.is_connected():
            self.logger.error("Not connected to MT5")
            return False
        
        if symbol not in self.tick_callbacks:
            self.tick_callbacks[symbol] = []
        
        self.tick_callbacks[symbol].append(callback)
        self.subscribed_symbols[symbol] = True
        
        self.logger.info(f"Subscribed to ticks for {symbol}")
        return True
    
    def unsubscribe_ticks(self, symbol: str, callback: Optional[Callable] = None) -> bool:
        """
        Unsubscribe from tick updates for a symbol.
        
        Args:
            symbol: Trading symbol
            callback: Specific callback to remove, None to remove all
            
        Returns:
            bool: True if unsubscription successful, False otherwise
        """
        if symbol not in self.tick_callbacks:
            return True
        
        if callback is None:
            del self.tick_callbacks[symbol]
            del self.subscribed_symbols[symbol]
            self.logger.info(f"Unsubscribed all callbacks for {symbol}")
        else:
            if callback in self.tick_callbacks[symbol]:
                self.tick_callbacks[symbol].remove(callback)
                self.logger.info(f"Unsubscribed callback for {symbol}")
            
            if not self.tick_callbacks[symbol]:
                del self.tick_callbacks[symbol]
                del self.subscribed_symbols[symbol]
        
        return True
    
    def start_tick_polling(self):
        """Start polling for tick updates."""
        if not self.connected:
            self.logger.error("Not connected to MT5")
            return
        
        if self.tick_polling_active:
            self.logger.warning("Tick polling already active")
            return
        
        self.tick_polling_active = True
        self.logger.info("Starting tick polling")
        
        import asyncio
        asyncio.create_task(self._tick_polling_loop())
    
    async def _tick_polling_loop(self):
        """Background loop for polling ticks."""
        import asyncio
        
        while self.tick_polling_active and self.connected:
            try:
                # Poll ticks for all subscribed symbols
                for symbol in list(self.subscribed_symbols.keys()):
                    tick = self.get_current_tick(symbol)
                    if tick and symbol in self.tick_callbacks:
                        # Call all callbacks for this symbol
                        for callback in self.tick_callbacks[symbol]:
                            try:
                                # If callback is a coroutine, await it
                                if asyncio.iscoroutinefunction(callback):
                                    await callback(tick)
                                else:
                                    callback(tick)
                            except Exception as e:
                                self.logger.error(f"Error in tick callback for {symbol}: {e}")
                
                await asyncio.sleep(self.tick_polling_interval)
                
            except asyncio.CancelledError:
                self.logger.info("Tick polling cancelled")
                break
            except Exception as e:
                self.logger.error(f"Error in tick polling loop: {e}")
                await asyncio.sleep(1)
    
    def stop_tick_polling(self):
        """Stop polling for tick updates."""
        self.tick_polling_active = False
        self.logger.info("Stopped tick polling")
    
    def get_all_symbols(self) -> List[str]:
        """
        Get all available symbols.
        
        Returns:
            List[str]: List of symbol names
        """
        if not self.is_connected():
            self.logger.error("Not connected to MT5")
            return []
        
        try:
            symbols = mt5.symbols_get()
            return [s.name for s in symbols] if symbols else []
        except Exception as e:
            self.logger.error(f"Error getting symbols: {e}")
        return []
    
    def __del__(self):
        """Destructor to ensure proper shutdown."""
        self.stop_tick_polling()
        self.disconnect()
