"""
Data Processing Module.
Handles data formatting, caching, and technical indicator calculations.
"""

import time
import logging
from typing import Dict, List, Any, Optional, Tuple
from datetime import datetime, timedelta
import pandas as pd
import numpy as np
from functools import lru_cache
from .config import config


class DataProcessor:
    """Data processor for MT5 data with caching and technical indicators."""
    
    def __init__(self):
        """Initialize data processor."""
        self.logger = logging.getLogger(__name__)
        self.cache = {}
        self.cache_timestamps = {}
        self.last_ticks = {}  # Store last tick for each symbol to calculate change
        self.daily_open_prices = {}  # Store daily open price for each symbol
        
    def format_tick_data(self, tick_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Format tick data for WebSocket broadcast.
        
        Args:
            tick_data: Raw tick data from MT5
            
        Returns:
            Dict: Formatted tick data
        """
        if not tick_data:
            return {}
        
        try:
            symbol = tick_data.get("symbol", "")
            bid = float(tick_data.get("bid", 0))
            ask = float(tick_data.get("ask", 0))
            last = float(tick_data.get("last", 0))
            
            # Use last price if available, otherwise bid
            price = last if last > 0 else bid
            
            # Convert time to ISO format if it's a timestamp
            tick_time = tick_data.get("time")
            if tick_time and isinstance(tick_time, (int, float)):
                tick_time = datetime.fromtimestamp(tick_time).isoformat()
            
            # Calculate daily change (from daily open price)
            change = 0.0
            change_percent = 0.0
            
            daily_open = self.daily_open_prices.get(symbol)
            
            if daily_open and daily_open > 0:
                change = price - daily_open
                change_percent = (change / daily_open) * 100
                self.logger.debug(f"[TICK] {symbol}: price={price}, daily_open={daily_open}, change={change:.4f}, change_percent={change_percent:.4f}%")
            else:
                # Se não tem daily_open, usar o primeiro preço registrado como referência
                if symbol not in self.last_ticks or "reference_price" not in self.last_ticks[symbol]:
                    self.last_ticks.setdefault(symbol, {})["reference_price"] = price
                    self.logger.info(f"[TICK] {symbol}: Setting reference_price={price} (first tick)")
                else:
                    ref_price = self.last_ticks[symbol]["reference_price"]
                    change = price - ref_price
                    change_percent = (change / ref_price) * 100 if ref_price > 0 else 0.0
                    self.logger.debug(f"[TICK] {symbol}: price={price}, reference_price={ref_price}, change={change:.4f}, change_percent={change_percent:.4f}%")
            
            # Update last tick data
            self.last_ticks[symbol] = {
                "bid": bid,
                "ask": ask,
                "time": tick_time or datetime.now().isoformat(),
                "reference_price": self.last_ticks.get(symbol, {}).get("reference_price", price)
            }
            
            return {
                "symbol": symbol,
                "bid": bid,
                "ask": ask,
                "last": float(tick_data.get("last", 0)),
                "volume": int(tick_data.get("volume", 0)),
                "time": tick_time or datetime.now().isoformat(),
                "spread": ask - bid,
                "change": change,
                "changePercent": change_percent
            }
        except Exception as e:
            self.logger.error(f"Error formatting tick data: {e}")
            return {}
    
    def format_candle_data(self, candles: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Format candle data for WebSocket broadcast.
        
        Args:
            candles: List of raw candle data from MT5
            
        Returns:
            List[Dict]: Formatted candle data
        """
        if not candles:
            return []
        
        formatted_candles = []
        for candle in candles:
            try:
                formatted_candles.append({
                    "time": candle.get("time", ""),
                    "open": float(candle.get("open", 0)),
                    "high": float(candle.get("high", 0)),
                    "low": float(candle.get("low", 0)),
                    "close": float(candle.get("close", 0)),
                    "volume": int(candle.get("tick_volume", 0)),
                    "spread": int(candle.get("spread", 0))
                })
            except Exception as e:
                self.logger.error(f"Error formatting candle data: {e}")
                continue
        
        return formatted_candles
    
    def format_order_book(self, order_book: Dict[str, Any]) -> Dict[str, Any]:
        """
        Format order book data.
        
        Args:
            order_book: Raw order book data
            
        Returns:
            Dict: Formatted order book data
        """
        if not order_book:
            return {}
        
        try:
            return {
                "symbol": order_book.get("symbol", ""),
                "time": order_book.get("time", datetime.now().isoformat()),
                "bids": order_book.get("bids", []),
                "asks": order_book.get("asks", []),
                "spread": float(order_book.get("spread", 0)),
                "mid_price": self._calculate_mid_price(order_book)
            }
        except Exception as e:
            self.logger.error(f"Error formatting order book: {e}")
            return {}
    
    def _calculate_mid_price(self, order_book: Dict[str, Any]) -> float:
        """
        Calculate mid price from order book.
        
        Args:
            order_book: Order book data
            
        Returns:
            float: Mid price
        """
        bids = order_book.get("bids", [])
        asks = order_book.get("asks", [])
        
        if not bids or not asks:
            return 0.0
        
        best_bid = max(bids, key=lambda x: x["price"])["price"] if bids else 0
        best_ask = min(asks, key=lambda x: x["price"])["price"] if asks else 0
        
        if best_bid and best_ask:
            return (best_bid + best_ask) / 2
        
        return 0.0
    
    @lru_cache(maxsize=128)
    def calculate_sma(self, prices: Tuple[float], period: int) -> Optional[float]:
        """
        Calculate Simple Moving Average.
        
        Args:
            prices: Tuple of price values
            period: SMA period
            
        Returns:
            Optional[float]: SMA value or None if insufficient data
        """
        if len(prices) < period:
            return None
        
        return float(np.mean(prices[-period:]))
    
    @lru_cache(maxsize=128)
    def calculate_ema(self, prices: Tuple[float], period: int) -> Optional[float]:
        """
        Calculate Exponential Moving Average.
        
        Args:
            prices: Tuple of price values
            period: EMA period
            
        Returns:
            Optional[float]: EMA value or None if insufficient data
        """
        if len(prices) < period:
            return None
        
        prices_array = np.array(prices[-period:])
        weights = np.exp(np.linspace(-1., 0., period))
        weights /= weights.sum()
        
        return float(np.dot(prices_array, weights))
    
    def calculate_rsi(self, prices: List[float], period: int = 14) -> Optional[float]:
        """
        Calculate Relative Strength Index.
        
        Args:
            prices: List of price values
            period: RSI period
            
        Returns:
            Optional[float]: RSI value or None if insufficient data
        """
        if len(prices) < period + 1:
            return None
        
        try:
            prices_array = np.array(prices)
            deltas = np.diff(prices_array)
            
            # Separate gains and losses
            gains = np.where(deltas > 0, deltas, 0)
            losses = np.where(deltas < 0, -deltas, 0)
            
            # Calculate average gains and losses
            avg_gain = np.mean(gains[-period:])
            avg_loss = np.mean(losses[-period:])
            
            if avg_loss == 0:
                return 100.0
            
            rs = avg_gain / avg_loss
            rsi = 100 - (100 / (1 + rs))
            
            return float(rsi)
        except Exception as e:
            self.logger.error(f"Error calculating RSI: {e}")
            return None
    
    def calculate_macd(self, prices: List[float], fast_period: int = 12, 
                      slow_period: int = 26, signal_period: int = 9) -> Optional[Dict[str, float]]:
        """
        Calculate MACD indicator.
        
        Args:
            prices: List of price values
            fast_period: Fast EMA period
            slow_period: Slow EMA period
            signal_period: Signal line period
            
        Returns:
            Optional[Dict]: MACD values or None if insufficient data
        """
        if len(prices) < slow_period + signal_period:
            return None
        
        try:
            prices_array = np.array(prices)
            
            # Calculate EMAs
            fast_ema = self._calculate_ema_array(prices_array, fast_period)
            slow_ema = self._calculate_ema_array(prices_array, slow_period)
            
            # Calculate MACD line
            macd_line = fast_ema - slow_ema
            
            # Calculate signal line
            signal_line = self._calculate_ema_array(macd_line, signal_period)
            
            # Calculate histogram
            histogram = macd_line - signal_line
            
            return {
                "macd": float(macd_line[-1]),
                "signal": float(signal_line[-1]),
                "histogram": float(histogram[-1])
            }
        except Exception as e:
            self.logger.error(f"Error calculating MACD: {e}")
            return None
    
    def _calculate_ema_array(self, data: np.ndarray, period: int) -> np.ndarray:
        """
        Calculate EMA for an array.
        
        Args:
            data: Input data array
            period: EMA period
            
        Returns:
            np.ndarray: EMA values
        """
        alpha = 2 / (period + 1)
        ema = np.zeros_like(data)
        ema[0] = data[0]
        
        for i in range(1, len(data)):
            ema[i] = alpha * data[i] + (1 - alpha) * ema[i-1]
        
        return ema
    
    def get_cached_data(self, key: str) -> Optional[Any]:
        """
        Get data from cache.
        
        Args:
            key: Cache key
            
        Returns:
            Optional[Any]: Cached data or None if expired/not found
        """
        if key not in self.cache:
            return None
        
        timestamp = self.cache_timestamps.get(key, 0)
        current_time = time.time()
        
        if current_time - timestamp > config.CACHE_TTL_SECONDS:
            # Cache expired
            del self.cache[key]
            del self.cache_timestamps[key]
            return None
        
        return self.cache[key]
    
    def set_cached_data(self, key: str, data: Any) -> None:
        """
        Set data in cache.
        
        Args:
            key: Cache key
            data: Data to cache
        """
        self.cache[key] = data
        self.cache_timestamps[key] = time.time()
    
    def clear_cache(self) -> None:
        """Clear all cached data."""
        self.cache.clear()
        self.cache_timestamps.clear()
        self.logger.info("Cache cleared")
    
    def update_daily_open_price(self, symbol: str, open_price: float) -> None:
        """
        Update the daily open price for a symbol (yesterday's close for daily change calculation).
        Only updates if the value changed significantly or if not set yet.
        
        Args:
            symbol: Trading symbol
            open_price: Daily open price (yesterday's close)
        """
        current_value = self.daily_open_prices.get(symbol)
        
        # Only update if not set or if value changed significantly (> 0.1% difference)
        if current_value is None or abs(open_price - current_value) / current_value > 0.001:
            self.daily_open_prices[symbol] = open_price
            self.logger.info(f"Updated daily reference price for {symbol}: {open_price:.5f} (was {current_value:.5f if current_value else 'None'})")
        else:
            self.logger.debug(f"[DAILY PRICE] {symbol}: Keeping existing reference {current_value:.5f} (new would be {open_price:.5f})")
    
    def get_daily_open_price(self, symbol: str) -> Optional[float]:
        """
        Get the daily open price for a symbol.
        
        Args:
            symbol: Trading symbol
            
        Returns:
            Optional[float]: Daily open price or None if not set
        """
        return self.daily_open_prices.get(symbol)
    
    def calculate_technical_indicators(self, symbol: str, candles: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Calculate technical indicators for a symbol.
        
        Args:
            symbol: Trading symbol
            candles: List of candle data
            
        Returns:
            Dict: Technical indicators
        """
        if not candles:
            return {}
        
        try:
            # Extract close prices
            close_prices = [float(candle["close"]) for candle in candles]
            
            # Calculate indicators
            sma_20 = self.calculate_sma(tuple(close_prices), 20)
            sma_50 = self.calculate_sma(tuple(close_prices), 50)
            ema_12 = self.calculate_ema(tuple(close_prices), 12)
            rsi_14 = self.calculate_rsi(close_prices, 14)
            macd = self.calculate_macd(close_prices)
            
            # Calculate volume metrics
            volumes = [candle.get("volume", 0) for candle in candles]
            avg_volume = np.mean(volumes[-20:]) if len(volumes) >= 20 else np.mean(volumes)
            
            # Calculate price change
            if len(close_prices) >= 2:
                price_change = close_prices[-1] - close_prices[-2]
                price_change_percent = (price_change / close_prices[-2]) * 100
            else:
                price_change = 0
                price_change_percent = 0
            
            return {
                "symbol": symbol,
                "time": datetime.now().isoformat(),
                "sma_20": sma_20,
                "sma_50": sma_50,
                "ema_12": ema_12,
                "rsi_14": rsi_14,
                "macd": macd,
                "current_price": close_prices[-1] if close_prices else 0,
                "price_change": price_change,
                "price_change_percent": price_change_percent,
                "avg_volume": float(avg_volume),
                "high_24h": max([candle["high"] for candle in candles[-24*12:]]) if len(candles) >= 24*12 else candles[-1]["high"],
                "low_24h": min([candle["low"] for candle in candles[-24*12:]]) if len(candles) >= 24*12 else candles[-1]["low"]
            }
        except Exception as e:
            self.logger.error(f"Error calculating technical indicators for {symbol}: {e}")
            return {}
    
    def generate_market_summary(self, symbols_data: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Generate market summary from multiple symbols.
        
        Args:
            symbols_data: List of symbol data
            
        Returns:
            Dict: Market summary
        """
        if not symbols_data:
            return {}
        
        try:
            # Calculate market metrics
            total_volume = sum([data.get("avg_volume", 0) for data in symbols_data])
            advancing = sum([1 for data in symbols_data if data.get("price_change_percent", 0) > 0])
            declining = sum([1 for data in symbols_data if data.get("price_change_percent", 0) < 0])
            unchanged = len(symbols_data) - advancing - declining
            
            # Find top movers
            top_gainers = sorted(
                [data for data in symbols_data if data.get("price_change_percent", 0) > 0],
                key=lambda x: x.get("price_change_percent", 0),
                reverse=True
            )[:5]
            
            top_losers = sorted(
                [data for data in symbols_data if data.get("price_change_percent", 0) < 0],
                key=lambda x: x.get("price_change_percent", 0)
            )[:5]
            
            # Calculate market sentiment
            avg_rsi = np.mean([data.get("rsi_14", 50) for data in symbols_data if data.get("rsi_14")])
            
            return {
                "time": datetime.now().isoformat(),
                "total_symbols": len(symbols_data),
                "total_volume": float(total_volume),
                "advancing": advancing,
                "declining": declining,
                "unchanged": unchanged,
                "advance_decline_ratio": advancing / max(declining, 1),
                "avg_rsi": float(avg_rsi) if not np.isnan(avg_rsi) else 50.0,
                "top_gainers": top_gainers,
                "top_losers": top_losers,
                "market_sentiment": "bullish" if avg_rsi > 50 else "bearish" if avg_rsi < 50 else "neutral"
            }
        except Exception as e:
            self.logger.error(f"Error generating market summary: {e}")
            return {}
