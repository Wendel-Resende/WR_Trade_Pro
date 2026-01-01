'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { wsClient } from '@/lib/websocket/client';

interface WebSocketContextType {
  isConnected: boolean;
  accountInfo: any;
}

const WebSocketContext = createContext<WebSocketContextType>({
  isConnected: false,
  accountInfo: null,
});

export function WebSocketProvider({ children }: { children: React.ReactNode }) {
  const [isConnected, setIsConnected] = useState(false);
  const [accountInfo, setAccountInfo] = useState<any>(null);
  const [hasAttempted, setHasAttempted] = useState(false);

  useEffect(() => {
    let mounted = true;

    // Escutar eventos de conexão do wsClient
    const handleConnected = () => {
      if (!mounted) return;
      setIsConnected(true);
      
      // Buscar info da conta APENAS uma vez
      if (!hasAttempted) {
        setHasAttempted(true);
        fetchAccountInfo();
      }
    };

    const handleDisconnected = () => {
      if (!mounted) return;
      setIsConnected(false);
    };

    const handleError = (error: any) => {
      if (!mounted) return;
      // Silenciar erro ECONNREFUSED - é esperado quando backend não está rodando
      if (error?.code === 'ECONNREFUSED' || error?.details?.includes('ECONNREFUSED')) {
        // Não logar nada - é comportamento esperado
        setIsConnected(false);
        setHasAttempted(true);
        return;
      }
      setIsConnected(false);
      setHasAttempted(true);
    };

    // Registrar listeners
    wsClient.on('connected', handleConnected);
    wsClient.on('disconnected', handleDisconnected);
    wsClient.on('error', handleError);

    // Iniciar conexão (com tratamento de erro silencioso)
    try {
      wsClient.connect().then(() => {
        // Conexão bem-sucedida
      }).catch(() => {
        // Conexão falhou
      });
    } catch (error) {
      setHasAttempted(true);
    }

    // Fallback: se não conectar em 5 segundos, marcar como tentado
    const fallbackTimer = setTimeout(() => {
      if (!isConnected && !hasAttempted) {
        setHasAttempted(true);
      }
    }, 5000);

    async function fetchAccountInfo() {
      try {
        const info = await wsClient.getAccountInfo();
        if (mounted) {
          setAccountInfo(info);
        }
      } catch (error) {
        // Não quebrar o app se não conseguir buscar account info
      }
    }

    return () => {
      mounted = false;
      clearTimeout(fallbackTimer);
      wsClient.off('connected', handleConnected);
      wsClient.off('disconnected', handleDisconnected);
      wsClient.off('error', handleError);
    };
  }, [hasAttempted]);

  return (
    <WebSocketContext.Provider value={{ isConnected, accountInfo }}>
      {children}
    </WebSocketContext.Provider>
  );
}

export const useWebSocket = () => useContext(WebSocketContext);
