import { ApiClientError, USE_MOCK_API, apiRequest } from '../lib/apiClient';
import type { UpdateUserRequest, User } from '../types/api';
import { getMockUsersRegistry } from './authService';

const delay = (ms = 200) => new Promise(resolve => setTimeout(resolve, ms));

export const userService = {
  async listUsers(): Promise<{ users: User[] }> {
    if (USE_MOCK_API) {
      await delay();
      return { users: [...getMockUsersRegistry()] };
    }
    return apiRequest<{ users: User[] }>('/users', { method: 'GET' });
  },

  async updateUser(id: string, payload: UpdateUserRequest): Promise<{ user: User }> {
    if (USE_MOCK_API) {
      await delay();
      const registry = getMockUsersRegistry();
      const idx = registry.findIndex(u => u.id === id);
      if (idx === -1) {
        throw new ApiClientError({
          status: 404,
          code: 'NOT_FOUND',
          message: 'User not found.',
        });
      }
      registry[idx] = {
        ...registry[idx],
        role: payload.role,
        account_status: payload.account_status,
      };
      return { user: registry[idx] };
    }

    return apiRequest<{ user: User }>(`/users/${encodeURIComponent(id)}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  },
};
