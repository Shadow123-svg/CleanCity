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
