import { USE_MOCK_API, apiRequest } from '../lib/apiClient';
import type { AppState, HealthResponse } from '../types/api';
import { SEED_CAMPUS_STATE } from './mockStore';

const MOCK_STATE_STORAGE_KEY = 'cleancity_mock_app_state_v1';

export const stateService = {
  async checkHealth(): Promise<HealthResponse> {
    if (USE_MOCK_API) {
      return { status: 'mock-ok' };
    }
    return apiRequest<HealthResponse>('/health', { method: 'GET', skipAuthRedirect: true });
  },

  async getState(): Promise<{ state: Partial<AppState> | null }> {
    if (USE_MOCK_API) {
      try {
        const raw = localStorage.getItem(MOCK_STATE_STORAGE_KEY);
        if (raw) {
          return { state: JSON.parse(raw) as Partial<AppState> };
        }
      } catch {
        // Fallback to seed data
      }
      return { state: SEED_CAMPUS_STATE };
    }
    return apiRequest<{ state: Partial<AppState> | null }>('/state', { method: 'GET' });
  },

  async saveState(state: AppState): Promise<{ message: string }> {
    if (USE_MOCK_API) {
      localStorage.setItem(MOCK_STATE_STORAGE_KEY, JSON.stringify(state));
      return { message: 'Application data saved locally.' };
    }
    return apiRequest<{ message: string }>('/state', {
      method: 'PUT',
      body: JSON.stringify(state),
    });
  },
};
