"""
WebSocket Server Module.
Handles real-time data broadcasting to connected clients.
"""

import asyncio
import logging
import json
from typing import Dict, List, Any, Optional, Set
import socketio
from aiohttp import web
from datetime import datetime
from .config import config
from .mt5_connector import MT5Connector
from .data_processor import DataProcessor


class WebSocketServer:
    """WebSocket server for real-time MT5 data broadcasting."""
    
    def __init__(self, mt5_connector: MT5Connector, data_processor: DataProcessor):
        """
        Initialize WebSocket server.
        
        Args:
            mt5_connector: MT5 connector instance
            data_processor: Data processor instance
        """
        self.logger = logging.getLogger(__name__)
        self.mt5 = mt5_connector
        self.processor = data_processor
        
        # Initialize Socket.IO server
        self.sio = socketio.AsyncServer(
            async_mode='aiohttp',
            cors_allowed_origins='*',
            ping_timeout=config.WS_PING_TIMEOUT,
            ping_interval=config.WS_PING_INTERVAL,
            max_http_buffer_size=config.WS_MAX_SIZE
        )
        
        # Initialize aiohttp app
        self.app = web.Application()
        self.sio.attach(self.app)
        
        # Track connected clients and subscriptions
        self.connected_clients: Set[str] = set()
        self.symbol_subscriptions: Dict[str, Set[str]] = {}  # symbol -> set of client IDs
        self.client_subscriptions: Dict[str, Set[str]] = {}  # client ID -> set of symbols
        self.last_daily_update: Optional[str] = None  # Last date when daily prices were updated
        
        # Setup event handlers
        self._setup_handlers()
        
        # Background tasks
        self.broadcast_task: Optional[asyncio.Task] = None
        self.health_check_task: Optional[asyncio.Task] = None
        
    def _setup_handlers(self) -> None:
        """Setup Socket.IO event handlers."""
        
        @self.sio.event
        async def connect(sid: str, environ: Dict[str, Any]) -> None:
            """Handle client connection."""
            self.connected_clients.add(sid)
            self.client_subscriptions[sid] = set()
            
            self.logger.info(f"Client connected: {sid}")
            await self.sio.emit('connected', {
                'sid': sid,
                'timestamp': datetime.now().isoformat(),
                'message': 'Connected to MT5 WebSocket Server'
            }, room=sid)
        
        @self.sio.event
        async def disconnect(sid: str, *args) -> None:
            """Handle client disconnection."""
            try:
                # Remove client from all subscriptions
                if sid in self.client_subscriptions:
                    for symbol in list(self.client_subscriptions[sid]):
                        await self._unsubscribe_client(sid, symbol)
                    del self.client_subscriptions[sid]
                
                self.connected_clients.discard(sid)
                self.logger.info(f"Client disconnected: {sid}")
            except KeyError:
                # Client já foi removido, ignorar erro
                pass
        
        @self.sio.event
        async def subscribe(sid: str, data: Dict[str, Any]) -> None:
            """Handle subscription request."""
            symbol = data.get('symbol')
            timeframe = data.get('timeframe', 'M5')
            
            if not symbol:
                await self.sio.emit('error', {
                    'message': 'Symbol is required',
                    'timestamp': datetime.now().isoformat()
                }, room=sid)
                return
            
            # Validate symbol
            symbol_info = self.mt5.get_symbol_info(symbol)
            if not symbol_info:
                await self.sio.emit('error', {
                    'message': f'Symbol {symbol} not found',
                    'timestamp': datetime.now().isoformat()
                }, room=sid)
                return
            
            # Subscribe client to symbol
            success = await self._subscribe_client(sid, symbol)
            
            if success:
                # Fetch and store daily open price
                await self._fetch_daily_open_price(symbol)
                
                # Send initial data
                await self._send_initial_data(sid, symbol, timeframe)
                
                await self.sio.emit('subscribed', {
                    'symbol': symbol,
                    'timeframe': timeframe,
                    'timestamp': datetime.now().isoformat(),
                    'message': f'Subscribed to {symbol}'
                }, room=sid)
            else:
                await self.sio.emit('error', {
                    'message': f'Failed to subscribe to {symbol}',
                    'timestamp': datetime.now().isoformat()
                }, room=sid)
        
        @self.sio.event
        async def unsubscribe(sid: str, data: Dict[str, Any]) -> None:
            """Handle unsubscription request."""
            symbol = data.get('symbol')
            
            if not symbol:
                await self.sio.emit('error', {
                    'message': 'Symbol is required',
                    'timestamp': datetime.now().isoformat()
                }, room=sid)
                return
            
            success = await self._unsubscribe_client(sid, symbol)
            
            if success:
                await self.sio.emit('unsubscribed', {
                    'symbol': symbol,
                    'timestamp': datetime.now().isoformat(),
                    'message': f'Unsubscribed from {symbol}'
                }, room=sid)
            else:
                await self.sio.emit('error', {
                    'message': f'Not subscribed to {symbol}',
                    'timestamp': datetime.now().isoformat()
                }, room=sid)
        
        @self.sio.event
        async def get_symbols(sid: str, data: Dict[str, Any] = None) -> None:
            """Handle get symbols request."""
            try:
                symbols = self.mt5.get_all_symbols()
                await self.sio.emit('symbols', {
                    'symbols': symbols,
                    'count': len(symbols),
                    'timestamp': datetime.now().isoformat()
                }, room=sid)
            except Exception as e:
                self.logger.error(f"Error getting symbols: {e}")
                await self.sio.emit('error', {
                    'message': 'Failed to get symbols',
                    'timestamp': datetime.now().isoformat()
                }, room=sid)
        
        @self.sio.event
        async def get_candles(sid: str, data: Dict[str, Any]) -> None:
            """Handle get candles request."""
            self.logger.info(f"[CANDLES] Event received from {sid}, data: {data}")
            
            symbol = data.get('symbol')
            timeframe = data.get('timeframe', 'M5')
            count = data.get('count', 100)
            
            self.logger.info(f"[CANDLES] Parsed request: symbol={symbol}, timeframe={timeframe}, count={count}")
            
            if not symbol:
                self.logger.warning(f"[CANDLES] No symbol provided by client {sid}")
                await self.sio.emit('error', {
                    'message': 'Symbol is required',
                    'timestamp': datetime.now().isoformat()
                }, room=sid)
                return
            
            try:
                self.logger.info(f"[CANDLES] Requesting candles for {symbol} ({timeframe}) count={count}")
                candles = self.mt5.get_candles(symbol, timeframe, count)
                self.logger.info(f"[CANDLES] get_candles returned {len(candles) if candles else 0} candles")
                
                if candles:
                    formatted_candles = self.processor.format_candle_data(candles)
                    self.logger.info(f"[CANDLES] Formatted {len(formatted_candles)} candles")
                    
                    candles_payload = {
                        'symbol': symbol,
                        'timeframe': timeframe,
                        'candles': formatted_candles,
                        'count': len(formatted_candles),
                        'timestamp': datetime.now().isoformat()
                    }
                    
                    self.logger.info(f"[CANDLES] Payload keys: {list(candles_payload.keys())}")
                    self.logger.info(f"[CANDLES] About to emit 'candles' to room={sid}")
                    
                    await self.sio.emit('candles', candles_payload, room=sid)
                    
                    self.logger.info(f"[CANDLES] Emit completed successfully")
                else:
                    self.logger.warning(f"[CANDLES] No candles received for {symbol}")
                    await self.sio.emit('error', {
                        'message': f'Failed to get candles for {symbol}',
                        'timestamp': datetime.now().isoformat()
                    }, room=sid)
            except Exception as e:
                self.logger.error(f"[CANDLES] Error getting candles: {e}", exc_info=True)
                await self.sio.emit('error', {
                    'message': 'Failed to get candles',
                    'timestamp': datetime.now().isoformat()
                }, room=sid)
        
        @self.sio.event
        async def get_order_book(sid: str, data: Dict[str, Any]) -> None:
            """Handle get order book request."""
            symbol = data.get('symbol')
            depth = data.get('depth', 10)
            
            if not symbol:
                await self.sio.emit('error', {
                    'message': 'Symbol is required',
                    'timestamp': datetime.now().isoformat()
                }, room=sid)
                return
            
            try:
                order_book = self.mt5.get_order_book(symbol, depth)
                if order_book:
                    formatted_order_book = self.processor.format_order_book(order_book)
                    await self.sio.emit('order_book', {
                        'symbol': symbol,
                        'order_book': formatted_order_book,
                        'timestamp': datetime.now().isoformat()
                    }, room=sid)
                else:
                    await self.sio.emit('error', {
                        'message': f'Failed to get order book for {symbol}',
                        'timestamp': datetime.now().isoformat()
                    }, room=sid)
            except Exception as e:
                self.logger.error(f"Error getting order book: {e}")
                await self.sio.emit('error', {
                    'message': 'Failed to get order book',
                    'timestamp': datetime.now().isoformat()
                }, room=sid)
        
        @self.sio.event
        async def get_account_info(sid: str, data: Dict[str, Any] = None) -> None:
            """Handle get account info request."""
            try:
                account_info = self.mt5.get_account_info()
                if account_info:
                    await self.sio.emit('account_info', {
                        'account': account_info,
                        'timestamp': datetime.now().isoformat()
                    }, room=sid)
                else:
                    await self.sio.emit('error', {
                        'message': 'Failed to get account info',
                        'timestamp': datetime.now().isoformat()
                    }, room=sid)
            except Exception as e:
                self.logger.error(f"Error getting account info: {e}")
                await self.sio.emit('error', {
                    'message': 'Failed to get account info',
                    'timestamp': datetime.now().isoformat()
                }, room=sid)
        
        @self.sio.event
        async def ping(sid: str, data: Dict[str, Any] = None) -> None:
            """Handle ping request."""
            await self.sio.emit('pong', {
                'timestamp': datetime.now().isoformat(),
                'server_time': datetime.now().isoformat()
            }, room=sid)
    
    async def _subscribe_client(self, sid: str, symbol: str) -> bool:
        """
        Subscribe client to symbol updates.
        
        Args:
            sid: Client session ID
            symbol: Trading symbol
            
        Returns:
            bool: True if successful, False otherwise
        """
        try:
            # Add to symbol subscriptions
            if symbol not in self.symbol_subscriptions:
                self.symbol_subscriptions[symbol] = set()
            self.symbol_subscriptions[symbol].add(sid)
            
            # Add to client subscriptions
            if sid not in self.client_subscriptions:
                self.client_subscriptions[sid] = set()
            self.client_subscriptions[sid].add(symbol)
            
            # Subscribe to MT5 ticks if first subscriber
            if len(self.symbol_subscriptions[symbol]) == 1:
                self.mt5.subscribe_ticks(symbol, self._create_tick_callback(symbol))
            
            self.logger.info(f"Client {sid} subscribed to {symbol}")
            return True
            
        except Exception as e:
            self.logger.error(f"Error subscribing client {sid} to {symbol}: {e}")
            return False
    
    async def _unsubscribe_client(self, sid: str, symbol: str) -> bool:
        """
        Unsubscribe client from symbol updates.
        
        Args:
            sid: Client session ID
            symbol: Trading symbol
            
        Returns:
            bool: True if successful, False otherwise
        """
        try:
            # Remove from symbol subscriptions
            if symbol in self.symbol_subscriptions:
                self.symbol_subscriptions[symbol].discard(sid)
                if not self.symbol_subscriptions[symbol]:
                    del self.symbol_subscriptions[symbol]
                    
                    # Unsubscribe from MT5 ticks if no more subscribers
                    self.mt5.unsubscribe_ticks(symbol)
            
            # Remove from client subscriptions
            if sid in self.client_subscriptions:
                self.client_subscriptions[sid].discard(symbol)
                if not self.client_subscriptions[sid]:
                    del self.client_subscriptions[sid]
            
            self.logger.info(f"Client {sid} unsubscribed from {symbol}")
            return True
            
        except Exception as e:
            self.logger.error(f"Error unsubscribing client {sid} from {symbol}: {e}")
            return False
    
    def _create_tick_callback(self, symbol: str):
        """Create tick callback function for a symbol."""
        async def tick_callback(tick_data: Dict[str, Any]) -> None:
            """Callback for tick updates."""
            try:
                formatted_tick = self.processor.format_tick_data(tick_data)
                
                # Log tick data para debug
                if formatted_tick.get('changePercent') is not None:
                    self.logger.debug(f"[TICK BROADCAST] {symbol}: price={formatted_tick.get('last')}, changePercent={formatted_tick.get('changePercent'):.4f}%")
                
                # Broadcast to all subscribed clients - usar list() para evitar erro "Set changed size during iteration"
                if symbol in self.symbol_subscriptions:
                    sids_to_send = list(self.symbol_subscriptions[symbol])
                    for sid in sids_to_send:
                        await self.sio.emit('tick', {
                            'symbol': symbol,
                            'tick': formatted_tick,
                            'timestamp': datetime.now().isoformat()
                        }, room=sid)
                        
                # Update cache
                cache_key = f"tick_{symbol}"
                self.processor.set_cached_data(cache_key, formatted_tick)
                
            except Exception as e:
                self.logger.error(f"Error in tick callback for {symbol}: {e}")
        
        return tick_callback
    
    async def _fetch_daily_open_price(self, symbol: str) -> None:
        """
        Fetch and store daily close price (for calculating daily change like MT5).
        
        MT5 calculates daily change as: (CurrentPrice - YesterdayClose) / YesterdayClose * 100
        
        Args:
            symbol: Trading symbol
        """
        try:
            # Get daily candles (D1 timeframe) - get 3 candles to ensure we have today and yesterday
            daily_candles = self.mt5.get_candles(symbol, 'D1', 3)
            
            if daily_candles and len(daily_candles) >= 2:
                # Get yesterday's close (MT5 calculates daily change from yesterday's close)
                # daily_candles[0] = today, daily_candles[1] = yesterday, daily_candles[2] = day before yesterday
                yesterday_candle = daily_candles[1]
                yesterday_close = float(yesterday_candle.get('close', 0))
                
                if yesterday_close > 0:
                    # Store yesterday's close as reference for daily change calculation
                    self.processor.update_daily_open_price(symbol, yesterday_close)
                    
                    # Log detailed information for debugging
                    current_tick = self.mt5.get_current_tick(symbol)
                    if current_tick:
                        current_price = float(current_tick.get('last', 0)) if float(current_tick.get('last', 0)) > 0 else float(current_tick.get('bid', 0))
                        change_from_yesterday = (current_price - yesterday_close) / yesterday_close * 100
                        
                        self.logger.info(f"[MT5 CHANGE] {symbol}: YesterdayClose={yesterday_close:.5f}, CurrentPrice={current_price:.5f}, Change={change_from_yesterday:+.4f}%")
                else:
                    self.logger.warning(f"Invalid yesterday close price for {symbol}: {yesterday_close}")
            else:
                self.logger.warning(f"[DAILY] Not enough daily candles available for {symbol} (got {len(daily_candles) if daily_candles else 0})")
        except Exception as e:
            self.logger.error(f"[DAILY] Error fetching daily close price for {symbol}: {e}")
    
    async def _send_initial_data(self, sid: str, symbol: str, timeframe: str) -> None:
        """
        Send initial data to newly subscribed client.
        
        Args:
            sid: Client session ID
            symbol: Trading symbol
            timeframe: Timeframe for candles
        """
        try:
            # Send current tick
            tick = self.mt5.get_current_tick(symbol)
            if tick:
                formatted_tick = self.processor.format_tick_data(tick)
                await self.sio.emit('tick', {
                    'symbol': symbol,
                    'tick': formatted_tick,
                    'timestamp': datetime.now().isoformat()
                }, room=sid)
            
            # Send recent candles
            candles = self.mt5.get_candles(symbol, timeframe, 100)
            if candles:
                formatted_candles = self.processor.format_candle_data(candles)
                await self.sio.emit('candles', {
                    'symbol': symbol,
                    'timeframe': timeframe,
                    'candles': formatted_candles,
                    'count': len(formatted_candles),
                    'timestamp': datetime.now().isoformat()
                }, room=sid)
            
            # Send technical indicators
            if candles:
                indicators = self.processor.calculate_technical_indicators(symbol, candles)
                if indicators:
                    await self.sio.emit('indicators', {
                        'symbol': symbol,
                        'indicators': indicators,
                        'timestamp': datetime.now().isoformat()
                    }, room=sid)
                    
        except Exception as e:
            self.logger.error(f"Error sending initial data to {sid}: {e}")
    
    async def start_broadcast_task(self) -> None:
        """Start background broadcast task."""
        self.broadcast_task = asyncio.create_task(self._broadcast_loop())
    
    async def _broadcast_loop(self) -> None:
        """Background loop for broadcasting data."""
        self.logger.info("Starting broadcast loop")
        
        while True:
            try:
                # Broadcast market summary periodically
                await self._broadcast_market_summary()
                
                # Broadcast account info updates
                await self._broadcast_account_updates()
                
                # Update daily open prices at the start of each new day
                await self._update_daily_prices_if_needed()
                
                # Sleep before next broadcast
                await asyncio.sleep(5)  # Broadcast every 5 seconds
                
            except asyncio.CancelledError:
                self.logger.info("Broadcast loop cancelled")
                break
            except Exception as e:
                self.logger.error(f"Error in broadcast loop: {e}")
                await asyncio.sleep(5)
    
    async def _broadcast_market_summary(self) -> None:
        """Broadcast market summary to all connected clients."""
        try:
            if not self.symbol_subscriptions:
                return
            
            # Get data for all subscribed symbols
            symbols_data = []
            for symbol in self.symbol_subscriptions.keys():
                candles = self.mt5.get_candles(symbol, 'M5', 100)
                if candles:
                    indicators = self.processor.calculate_technical_indicators(symbol, candles)
                    if indicators:
                        symbols_data.append(indicators)
            
            if symbols_data:
                market_summary = self.processor.generate_market_summary(symbols_data)
                
                # Broadcast to all connected clients
                await self.sio.emit('market_summary', {
                    'summary': market_summary,
                    'timestamp': datetime.now().isoformat()
                })
                
        except Exception as e:
            self.logger.error(f"Error broadcasting market summary: {e}")
    
    async def _broadcast_account_updates(self) -> None:
        """Broadcast account updates to all connected clients."""
        try:
            account_info = self.mt5.get_account_info()
            if account_info:
                await self.sio.emit('account_update', {
                    'account': account_info,
                    'timestamp': datetime.now().isoformat()
                })
                
        except Exception as e:
            self.logger.error(f"Error broadcasting account updates: {e}")
    
    async def _update_daily_prices_if_needed(self) -> None:
        """Update daily open prices if the day has changed."""
        try:
            current_date = datetime.now().date().isoformat()
            
            # Check if we need to update (first run or new day)
            if self.last_daily_update is None or self.last_daily_update != current_date:
                self.logger.info(f"New day detected ({current_date}), updating daily open prices...")
                
                # Update for all subscribed symbols
                for symbol in self.symbol_subscriptions.keys():
                    await self._fetch_daily_open_price(symbol)
                
                self.last_daily_update = current_date
                self.logger.info(f"Daily open prices updated for {len(self.symbol_subscriptions)} symbols")
                
        except Exception as e:
            self.logger.error(f"Error updating daily prices: {e}")
    
    async def start_health_check(self) -> None:
        """Start health check task."""
        self.health_check_task = asyncio.create_task(self._health_check_loop())
    
    async def _health_check_loop(self) -> None:
        """Background health check loop."""
        self.logger.info("Starting health check loop")
        
        while True:
            try:
                # Check MT5 connection
                is_connected = self.mt5.is_connected()
                
                # Broadcast health status
                await self.sio.emit('health', {
                    'mt5_connected': is_connected,
                    'clients_connected': len(self.connected_clients),
                    'timestamp': datetime.now().isoformat()
                })
                
                # Reconnect if disconnected
                if not is_connected:
                    self.logger.warning("MT5 disconnected, attempting to reconnect...")
                    self.mt5.connect()
                
                await asyncio.sleep(30)  # Check every 30 seconds
                
            except asyncio.CancelledError:
                self.logger.info("Health check loop cancelled")
                break
            except Exception as e:
                self.logger.error(f"Error in health check loop: {e}")
                await asyncio.sleep(30)
    
    async def start(self) -> None:
        """Start the WebSocket server."""
        try:
            # Start tick polling
            self.mt5.start_tick_polling()
            
            # Start background tasks
            await self.start_broadcast_task()
            await self.start_health_check()
            
            # Create HTTP routes
            self.app.router.add_get('/', self._handle_root)
            self.app.router.add_get('/health', self._handle_health)
            self.app.router.add_get('/quotes/{symbol}', self._handle_quotes)
            
            # Start the server
            runner = web.AppRunner(self.app)
            await runner.setup()
            
            site = web.TCPSite(runner, config.WS_HOST, config.WS_PORT)
            await site.start()
            
            self.logger.info(f"WebSocket server started on {config.WS_HOST}:{config.WS_PORT}")
            
            # Keep server running
            await asyncio.Future()
            
        except Exception as e:
            self.logger.error(f"Error starting WebSocket server: {e}")
            raise
    
    async def stop(self) -> None:
        """Stop the WebSocket server."""
        self.logger.info("Stopping WebSocket server...")
        
        # Stop tick polling
        self.mt5.stop_tick_polling()
        
        # Cancel background tasks
        if self.broadcast_task:
            self.broadcast_task.cancel()
            try:
                await self.broadcast_task
            except asyncio.CancelledError:
                pass
        
        if self.health_check_task:
            self.health_check_task.cancel()
            try:
                await self.health_check_task
            except asyncio.CancelledError:
                pass
        
        # Disconnect MT5
        self.mt5.disconnect()
        
        self.logger.info("WebSocket server stopped")
    
    async def _handle_root(self, request: web.Request) -> web.Response:
        """Handle root HTTP request."""
        return web.Response(
            text=json.dumps({
                'service': 'MT5 WebSocket Server',
                'version': '1.0.0',
                'status': 'running',
                'clients_connected': len(self.connected_clients),
                'timestamp': datetime.now().isoformat()
            }),
            content_type='application/json'
        )
    
    async def _handle_health(self, request: web.Request) -> web.Response:
        """Handle health check HTTP request."""
        mt5_connected = self.mt5.is_connected()
        
        return web.Response(
            text=json.dumps({
                'status': 'healthy' if mt5_connected else 'degraded',
                'mt5_connected': mt5_connected,
                'clients_connected': len(self.connected_clients),
                'symbols_subscribed': len(self.symbol_subscriptions),
                'timestamp': datetime.now().isoformat()
            }),
            content_type='application/json'
        )
    
    async def _handle_quotes(self, request: web.Request) -> web.Response:
        """
        Handle quotes HTTP request.
        Returns current quote with change percentage.
        """
        try:
            symbol = request.match_info.get('symbol')
            if not symbol:
                return web.Response(
                    text=json.dumps({'error': 'Symbol is required'}),
                    content_type='application/json',
                    status=400
                )
            
            # Fetch daily open price (close of previous day) - atualizar sempre
            await self._fetch_daily_open_price(symbol)
            
            # Get current tick
            tick = self.mt5.get_current_tick(symbol)
            if not tick:
                return web.Response(
                    text=json.dumps({'error': f'Failed to get quote for {symbol}'}),
                    content_type='application/json',
                    status=404
                )
            
            # Format tick data (this calculates changePercent)
            formatted_tick = self.processor.format_tick_data(tick)
            
            # Log para debug da variação
            self.logger.debug(f"[QUOTES] {symbol}: price={formatted_tick.get('last')}, changePercent={formatted_tick.get('changePercent'):.4f}%")
            
            return web.Response(
                text=json.dumps({
                    'symbol': symbol,
                    'bid': formatted_tick.get('bid'),
                    'ask': formatted_tick.get('ask'),
                    'last': formatted_tick.get('last'),
                    'price': formatted_tick.get('last') if formatted_tick.get('last') > 0 else formatted_tick.get('bid'),
                    'volume': formatted_tick.get('volume'),
                    'time': formatted_tick.get('time'),
                    'spread': formatted_tick.get('spread'),
                    'change': formatted_tick.get('change'),
                    'changePercent': formatted_tick.get('changePercent'),
                    'timestamp': datetime.now().isoformat()
                }),
                content_type='application/json'
            )
        except Exception as e:
            self.logger.error(f"Error in quotes endpoint for {symbol}: {e}")
            return web.Response(
                text=json.dumps({'error': 'Internal server error'}),
                content_type='application/json',
                status=500
            )
