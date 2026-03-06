'use client';

import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

export interface AuthUser {
  id: number;
  email: string;
  name: string | null;
}

interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);
const AUTH_API_TIMEOUT_MS = 12000;

async function parseApiError(res: Response, fallback: string): Promise<string> {
  let apiMessage: string | null = null;

  try {
    const body = await res.json();
    apiMessage = typeof body?.error === 'string' ? body.error : null;
  } catch {
    apiMessage = null;
  }

  if (res.status === 429) {
    const retryAfter = Number(res.headers.get('Retry-After') || '0');
    if (Number.isFinite(retryAfter) && retryAfter > 0) {
      const waitMinutes = Math.ceil(retryAfter / 60);
      return `Too many attempts. Please wait about ${waitMinutes} minute${waitMinutes === 1 ? '' : 's'} and try again.`;
    }
    return apiMessage || 'Too many attempts. Please wait before trying again.';
  }

  if (res.status === 503) {
    return apiMessage || 'Service is temporarily unavailable. Please try again shortly.';
  }

  return apiMessage || fallback;
}

async function fetchWithTimeout(url: string, init: RequestInit = {}, timeoutMs = AUTH_API_TIMEOUT_MS) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, {
      ...init,
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeout);
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshSession = async () => {
    try {
      const res = await fetchWithTimeout('/api/auth/me', {
        method: 'GET',
        credentials: 'include',
        cache: 'no-store',
      });

      if (!res.ok) {
        if (res.status === 401) {
          setUser(null);
          setError(null);
          return;
        }

        const message = await parseApiError(
          res,
          'Unable to verify session right now. Please try again.'
        );
        setUser(null);
        setError(message);
        return;
      }

      const data = await res.json();
      setUser(data.user || null);
      setError(null);
    } catch {
      setUser(null);
      setError('Unable to connect to server. Please try again.');
    }
  };

  useEffect(() => {
    const run = async () => {
      try {
        await refreshSession();
      } finally {
        setIsLoading(false);
      }
    };

    run();
  }, []);

  const login = async (email: string, password: string) => {
    const res = await fetchWithTimeout('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ email, password }),
    });

    if (!res.ok) {
      const message = await parseApiError(res, 'Failed to login.');
      setError(message);
      throw new Error(message);
    }

    const data = await res.json();
    setUser(data.user || null);
    setError(null);
  };

  const signup = async (name: string, email: string, password: string) => {
    const res = await fetchWithTimeout('/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ name, email, password }),
    });

    if (!res.ok) {
      const message = await parseApiError(res, 'Failed to create account.');
      setError(message);
      throw new Error(message);
    }

    const data = await res.json();
    setUser(data.user || null);
    setError(null);
  };

  const logout = async () => {
    const res = await fetchWithTimeout('/api/auth/logout', {
      method: 'POST',
      credentials: 'include',
    });

    if (!res.ok) {
      const message = await parseApiError(res, 'Failed to logout.');
      setError(message);
      throw new Error(message);
    }

    setUser(null);
    setError(null);
  };

  const clearError = () => setError(null);

  const value = useMemo(
    () => ({ user, isLoading, error, login, signup, logout, refreshSession, clearError }),
    [user, isLoading, error]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
