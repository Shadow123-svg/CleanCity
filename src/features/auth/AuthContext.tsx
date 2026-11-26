import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import {
  ApiClientError,
  registerUnauthorizedHandler,
  setInMemorySessionToken,
} from '../../lib/apiClient';
import { authService } from '../../services/authService';
import type { LoginRequest, RegisterRequest, User } from '../../types/api';

export type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated';

interface AuthContextValue {
  user: User | null;
  status: AuthStatus;
  sessionError: string | null;
  login: (payload: LoginRequest) => Promise<User>;
  register: (payload: RegisterRequest) => Promise<string>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<void>;
  updateCurrentUser: (nextUser: User) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [status, setStatus] = useState<AuthStatus>('loading');
  const [sessionError, setSessionError] = useState<string | null>(null);

  const handleUnauthorized = useCallback(() => {
    setInMemorySessionToken(null);
    setUser(null);
    setStatus('unauthenticated');
  }, []);

  useEffect(() => {
    registerUnauthorizedHandler(handleUnauthorized);
    return () => registerUnauthorizedHandler(null);
  }, [handleUnauthorized]);

  const refreshSession = useCallback(async () => {
    try {
      const { user: activeUser } = await authService.me();
      setUser(activeUser);
      setSessionError(null);
      setStatus('authenticated');
    } catch (err) {
      setUser(null);
      setStatus('unauthenticated');
      if (err instanceof ApiClientError && err.status !== 401) {
        setSessionError(err.message);
      } else {
        setSessionError(null);
      }
    }
  }, []);

  useEffect(() => {
    void refreshSession();
  }, [refreshSession]);

  const login = useCallback(async (payload: LoginRequest): Promise<User> => {
    const response = await authService.login(payload);
    setUser(response.user);
    setSessionError(null);
    setStatus('authenticated');
    return response.user;
  }, []);

  const register = useCallback(async (payload: RegisterRequest): Promise<string> => {
    const response = await authService.register(payload);
    return response.message;
  }, []);

  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } finally {
      setUser(null);
      setStatus('unauthenticated');
    }
  }, []);

  const updateCurrentUser = useCallback((nextUser: User) => {
    setUser(prev => (prev && prev.id === nextUser.id ? nextUser : prev));
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        status,
        sessionError,
        login,
        register,
        logout,
        refreshSession,
        updateCurrentUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider.');
  return ctx;
}
