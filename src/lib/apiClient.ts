import type { NormalizedApiError } from '../types/api';

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '/api').replace(/\/$/, '');
export const USE_MOCK_API = import.meta.env.VITE_USE_MOCK_API === 'true';

export class ApiClientError extends Error implements NormalizedApiError {
  status: number;
  code: string;
  fieldErrors?: Record<string, string>;

  constructor(payload: NormalizedApiError) {
    super(payload.message);
    this.name = 'ApiClientError';
    this.status = payload.status;
    this.code = payload.code;
    this.fieldErrors = payload.fieldErrors;
  }
}

type UnauthorizedHandler = () => void;
let onUnauthorized: UnauthorizedHandler | null = null;
let inMemorySessionToken: string | null = null;

export function registerUnauthorizedHandler(handler: UnauthorizedHandler | null): void {
  onUnauthorized = handler;
}

export function setInMemorySessionToken(token: string | null): void {
  inMemorySessionToken = token;
}

export function getInMemorySessionToken(): string | null {
  return inMemorySessionToken;
}

/**
 * Maps server/index.js plain `{ error: string }` responses into field-level hints
 * so auth and admin forms highlight the exact offending input without backend changes.
 */
function inferFieldErrors(message: string): Record<string, string> | undefined {
  const lower = message.toLowerCase();
  if (lower.includes('valid email') || lower.includes('this email already exists')) {
    return { email: message };
  }
  if (lower.includes('passwords do not match')) {
    return { confirm_password: message };
  }
  if (lower.includes('at least 12 characters')) {
    return { password: message };
  }
  if (lower.includes('registration is not authorized')) {
    return { auth_code: message };
  }
  if (lower.includes('invalid email or password')) {
    return { email: 'Check your email or password.', password: 'Invalid credentials.' };
  }
  return undefined;
}

function statusToCode(status: number): string {
  switch (status) {
    case 400:
      return 'VALIDATION_ERROR';
    case 401:
      return 'UNAUTHORIZED';
    case 403:
      return 'FORBIDDEN';
    case 404:
      return 'NOT_FOUND';
    case 409:
      return 'CONFLICT';
    default:
      return status >= 500 ? 'SERVER_ERROR' : 'REQUEST_ERROR';
  }
}

export interface RequestOptions extends RequestInit {
  /** Skip triggering global 401 redirect (used for /auth/me bootstrap and /auth/login). */
  skipAuthRedirect?: boolean;
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { skipAuthRedirect = false, headers: rawHeaders, ...rest } = options;
  const headers = new Headers(rawHeaders);

  if (rest.body && !(rest.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const normalizedPath = path.startsWith('/') ? path : `/${path}`;

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${normalizedPath}`, {
      ...rest,
      headers,
      // server/index.js authenticates REST endpoints via the HttpOnly `cleancity_session` cookie.
      credentials: 'include',
    });
  } catch {
    throw new ApiClientError({
      status: 0,
      code: 'NETWORK_ERROR',
      message: 'Unable to reach the CleanCity backend server. Verify the API is running on port 3001.',
    });
  }

  let parsed: unknown = null;
  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    try {
      parsed = await response.json();
    } catch {
      parsed = null;
    }
  }

  if (!response.ok) {
    const serverMessage =
      typeof parsed === 'object' && parsed !== null && 'error' in parsed && typeof (parsed as { error: unknown }).error === 'string'
        ? (parsed as { error: string }).error
        : `Request failed with status ${response.status}.`;

    if (response.status === 401 && !skipAuthRedirect) {
      inMemorySessionToken = null;
      onUnauthorized?.();
    }

    throw new ApiClientError({
      status: response.status,
      code: statusToCode(response.status),
      message: serverMessage,
      fieldErrors: inferFieldErrors(serverMessage),
    });
  }

  if (parsed === null) {
    throw new ApiClientError({
      status: response.status,
      code: 'INVALID_RESPONSE',
      message: 'The server returned an unexpected non-JSON response.',
    });
  }

  return parsed as T;
}
