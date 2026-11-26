import {
  ApiClientError,
  USE_MOCK_API,
  apiRequest,
  setInMemorySessionToken,
} from '../lib/apiClient';
import type {
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  RegisterResponse,
  User,
} from '../types/api';
import { MOCK_USERS } from './mockStore';

const MOCK_SESSION_KEY = 'cleancity_mock_user_id';
const mockUsersRegistry: User[] = [...MOCK_USERS];

export function getMockUsersRegistry(): User[] {
  return mockUsersRegistry;
}

const delay = (ms = 260) => new Promise(resolve => setTimeout(resolve, ms));

export const authService = {
  async login(payload: LoginRequest): Promise<LoginResponse> {
    if (USE_MOCK_API) {
      await delay();
      const email = payload.email.trim().toLowerCase();
      const user = mockUsersRegistry.find(u => u.email.toLowerCase() === email);
      if (!user || payload.password.length < 6) {
        throw new ApiClientError({
          status: 401,
          code: 'UNAUTHORIZED',
          message: 'Invalid email or password.',
          fieldErrors: { email: 'Check your email or password.' },
        });
      }
      if (user.account_status !== 'Active') {
        throw new ApiClientError({
          status: 403,
          code: 'FORBIDDEN',
          message:
            user.account_status === 'Pending Approval'
              ? 'Your account is pending administrator approval.'
              : 'This account has been deactivated.',
        });
      }
      localStorage.setItem(MOCK_SESSION_KEY, user.id);
      const token = `mock-session-${user.id}`;
      setInMemorySessionToken(token);
      return {
        user,
        session_token: token,
        expires_at: new Date(Date.now() + 8 * 3600_000).toISOString(),
      };
    }

    const res = await apiRequest<LoginResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload),
      skipAuthRedirect: true,
    });
    setInMemorySessionToken(res.session_token || null);
    return res;
  },

  async register(payload: RegisterRequest): Promise<RegisterResponse> {
    if (USE_MOCK_API) {
      await delay();
      if (payload.password.length < 12) {
        throw new ApiClientError({
          status: 400,
          code: 'VALIDATION_ERROR',
          message: 'Password must be at least 12 characters.',
          fieldErrors: { password: 'Password must be at least 12 characters.' },
        });
      }
      if (payload.password !== payload.confirm_password) {
        throw new ApiClientError({
          status: 400,
          code: 'VALIDATION_ERROR',
          message: 'Passwords do not match.',
          fieldErrors: { confirm_password: 'Passwords do not match.' },
        });
      }
      if (mockUsersRegistry.some(u => u.email.toLowerCase() === payload.email.trim().toLowerCase())) {
        throw new ApiClientError({
          status: 409,
          code: 'CONFLICT',
          message: 'An account with this email already exists.',
          fieldErrors: { email: 'An account with this email already exists.' },
        });
      }
      const id = `USR-${Date.now().toString(36).toUpperCase()}`;
      mockUsersRegistry.push({
        id,
        full_name: payload.full_name.trim(),
        email: payload.email.trim().toLowerCase(),
        phone: payload.phone.trim(),
        organization: payload.organization.trim(),
        role: 'Field Staff',
        employee_id: `REG-${id.slice(-6)}`,
        account_status: 'Pending Approval',
        created_at: new Date().toISOString(),
      });
      return { message: 'Registration submitted for administrator approval.' };
    }

    return apiRequest<RegisterResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
      skipAuthRedirect: true,
    });
  },

  async me(): Promise<{ user: User }> {
    if (USE_MOCK_API) {
      await delay(150);
      const id = localStorage.getItem(MOCK_SESSION_KEY);
      const user = mockUsersRegistry.find(u => u.id === id && u.account_status === 'Active');
      if (!user) {
        throw new ApiClientError({
          status: 401,
          code: 'UNAUTHORIZED',
          message: 'Authentication required.',
        });
      }
      setInMemorySessionToken(`mock-session-${user.id}`);
      return { user };
    }

    return apiRequest<{ user: User }>('/auth/me', {
      method: 'GET',
      skipAuthRedirect: true,
    });
  },

  async logout(): Promise<{ message: string }> {
    setInMemorySessionToken(null);
    if (USE_MOCK_API) {
      await delay(120);
      localStorage.removeItem(MOCK_SESSION_KEY);
      return { message: 'Signed out.' };
    }

    return apiRequest<{ message: string }>('/auth/logout', {
      method: 'POST',
      skipAuthRedirect: true,
    });
  },

  // TODO: missing backend route — server/index.js does not expose POST /api/auth/forgot-password yet.
  async requestPasswordReset(email: string): Promise<{ message: string }> {
    await delay(300);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      throw new ApiClientError({
        status: 400,
        code: 'VALIDATION_ERROR',
        message: 'Enter a valid university or staff email address.',
        fieldErrors: { email: 'Enter a valid email address.' },
      });
    }
    return {
      message:
        'Password reset is currently managed by the Facilities Super Admin. Your request reference has been noted — contact the Facilities Management Office to reissue credentials.',
    };
  },
};
