export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

export async function apiRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers);
  if (options.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(`/api${path}`, {
    ...options,
    headers,
    credentials: 'include',
  });
  let result: unknown;
  try {
    result = await response.json();
  } catch {
    throw new ApiError('The server returned an invalid response.', response.status);
  }
  if (!response.ok) {
    const message = typeof result === 'object' && result !== null && 'error' in result
      ? result.error
      : undefined;
    throw new ApiError(typeof message === 'string' ? message : 'The server could not complete the request.', response.status);
  }
  return result as T;
}

export interface RealtimeMessage {
  type: string;
  state?: unknown;
  user?: unknown;
  timestamp?: string;
  error?: string;
}

export function createRealtimeConnection(
  sessionToken?: string,
  onMessage?: (message: RealtimeMessage) => void,
): WebSocket {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const tokenQuery = sessionToken ? `?token=${encodeURIComponent(sessionToken)}` : '';
  const socket = new WebSocket(`${protocol}//${window.location.host}/ws${tokenQuery}`);
  socket.addEventListener('open', () => {
    socket.send(JSON.stringify({ type: 'subscribe' }));
  });
  socket.addEventListener('message', event => {
    try {
      const message = JSON.parse(String(event.data)) as RealtimeMessage;
      onMessage?.(message);
    } catch {
      // Ignore malformed server frames.
    }
  });
  return socket;
}
