import { USE_MOCK_API, getInMemorySessionToken } from '../lib/apiClient';
import type { RealtimeMessage } from '../types/api';

const WS_PATH = import.meta.env.VITE_WS_PATH || '/ws';

export type RealtimeStatus = 'connecting' | 'connected' | 'disconnected' | 'mock';

export interface RealtimeConnectionHandle {
  close: () => void;
  requestState: () => void;
}

export function connectRealtime(handlers: {
  onMessage: (message: RealtimeMessage) => void;
  onStatusChange?: (status: RealtimeStatus) => void;
}): RealtimeConnectionHandle {
  if (USE_MOCK_API) {
    handlers.onStatusChange?.('mock');
    return {
      close: () => undefined,
      requestState: () => undefined,
    };
  }

  let socket: WebSocket | null = null;
  let reconnectTimer: number | null = null;
  let pingTimer: number | null = null;
  let stopped = false;

  const cleanupTimers = () => {
    if (reconnectTimer !== null) {
      window.clearTimeout(reconnectTimer);
      reconnectTimer = null;
    }
    if (pingTimer !== null) {
      window.clearInterval(pingTimer);
      pingTimer = null;
    }
  };

  const openSocket = () => {
    if (stopped) return;
    handlers.onStatusChange?.('connecting');

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const token = getInMemorySessionToken();
    const query = token ? `?token=${encodeURIComponent(token)}` : '';
    socket = new WebSocket(`${protocol}//${window.location.host}${WS_PATH}${query}`);

    socket.addEventListener('open', () => {
      handlers.onStatusChange?.('connected');
      socket?.send(JSON.stringify({ type: 'subscribe' }));
      pingTimer = window.setInterval(() => {
        if (socket?.readyState === WebSocket.OPEN) {
          socket.send(JSON.stringify({ type: 'ping' }));
        }
      }, 25_000);
    });

    socket.addEventListener('message', event => {
      try {
        const parsed = JSON.parse(String(event.data)) as RealtimeMessage;
        handlers.onMessage(parsed);
      } catch {
        // Ignore malformed frames
      }
    });

    socket.addEventListener('close', () => {
      cleanupTimers();
      handlers.onStatusChange?.('disconnected');
      if (!stopped) {
        reconnectTimer = window.setTimeout(openSocket, 3500);
      }
    });

    socket.addEventListener('error', () => {
      socket?.close();
    });
  };

  openSocket();

  return {
    close: () => {
      stopped = true;
      cleanupTimers();
      socket?.close();
    },
    requestState: () => {
      if (socket?.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({ type: 'state.request' }));
      }
    },
  };
}
