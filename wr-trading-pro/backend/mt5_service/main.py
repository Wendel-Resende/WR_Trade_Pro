"""
Main entry point for MT5 Service.
Initializes MT5 connection and starts WebSocket server.
"""

import asyncio
import logging
import signal
import sys
from typing import Optional
from .config import config
from .mt5_connector import MT5Connector
from .data_processor import DataProcessor
from .websocket_server import WebSocketServer


class MT5Service:
    """Main MT5 service class."""
    
    def __init__(self):
        """Initialize MT5 service."""
        self.logger = logging.getLogger(__name__)
        self.mt5: Optional[MT5Connector] = None
        self.processor: Optional[DataProcessor] = None
        self.server: Optional[WebSocketServer] = None
        self.running = False
        
        # Setup logging
        self._setup_logging()
        
    def _setup_logging(self) -> None:
        """Setup logging configuration."""
        logging.basicConfig(
            level=getattr(logging, config.LOG_LEVEL),
            format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
            handlers=[
                logging.FileHandler(config.LOG_FILE),
                logging.StreamHandler(sys.stdout)
            ]
        )
        
        # Set specific log levels for noisy libraries
        logging.getLogger('socketio').setLevel(logging.WARNING)
        logging.getLogger('engineio').setLevel(logging.WARNING)
        logging.getLogger('aiohttp').setLevel(logging.WARNING)
        
    async def initialize(self) -> bool:
        """
        Initialize MT5 service components.
        
        Returns:
            bool: True if initialization successful, False otherwise
        """
        try:
            self.logger.info("Initializing MT5 Service...")
            
            # Print configuration
            config.print_config()
            
            # Validate configuration
            if not config.validate():
                self.logger.error("Configuration validation failed")
                return False
            
            # Initialize MT5 connector
            self.mt5 = MT5Connector()
            
            # Connect to MT5
            if not self.mt5.connect():
                self.logger.error("Failed to connect to MT5")
                return False
            
            # Initialize data processor
            self.processor = DataProcessor()
            
            # Initialize WebSocket server
            self.server = WebSocketServer(self.mt5, self.processor)
            
            self.logger.info("MT5 Service initialized successfully")
            return True
            
        except Exception as e:
            self.logger.error(f"Error initializing MT5 Service: {e}")
            return False
    
    async def start(self) -> None:
        """Start the MT5 service."""
        try:
            self.logger.info("Starting MT5 Service...")
            
            if not await self.initialize():
                self.logger.error("Failed to initialize MT5 Service")
                return
            
            # Setup signal handlers
            self._setup_signal_handlers()
            
            # Start WebSocket server
            self.running = True
            await self.server.start()
            
        except KeyboardInterrupt:
            self.logger.info("Service stopped by user")
        except Exception as e:
            self.logger.error(f"Error starting MT5 Service: {e}")
        finally:
            await self.stop()
    
    async def stop(self) -> None:
        """Stop the MT5 service."""
        if not self.running:
            return
        
        self.logger.info("Stopping MT5 Service...")
        self.running = False
        
        try:
            # Stop WebSocket server
            if self.server:
                await self.server.stop()
            
            # Disconnect MT5
            if self.mt5:
                self.mt5.disconnect()
            
            self.logger.info("MT5 Service stopped")
            
        except Exception as e:
            self.logger.error(f"Error stopping MT5 Service: {e}")
    
    def _setup_signal_handlers(self) -> None:
        """Setup signal handlers for graceful shutdown."""
        signal.signal(signal.SIGINT, self._signal_handler)
        signal.signal(signal.SIGTERM, self._signal_handler)
    
    def _signal_handler(self, signum, frame) -> None:
        """Handle shutdown signals."""
        self.logger.info(f"Received signal {signum}, shutting down...")
        asyncio.create_task(self.stop())


async def main() -> None:
    """Main entry point."""
    service = MT5Service()
    await service.start()


if __name__ == "__main__":
    # Run the service
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\nService stopped by user")
    except Exception as e:
        print(f"Fatal error: {e}")
        sys.exit(1)
