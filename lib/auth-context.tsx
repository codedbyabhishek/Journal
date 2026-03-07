'use client';

import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

export interface AuthUser {
  id: number;
  email: string;
  name: string | null;
  emailVerified: boolean;
}

export interface AuthActionMeta {
  message?: string;
  devResetToken?: string;
  devVerificationToken?: string;
  requiresEmailVerification?: boolean;
}

interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string) => Promise<AuthActionMeta>;
  verifyEmail: (token: string) => Promise<AuthActionMeta>;
  resendVerification: (email: string) => Promise<AuthActionMeta>;
  forgotPassword: (email: string) => Promise<AuthActionMeta>;
  resetPassword: (token: string, password: string) => Promise<AuthActionMeta>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);
const AUTH_API_TIMEOUT_MS = 12000;

async function parseApiError(res: Response, fallback: string): Promise<string> {
  try {
    const body = await res.json();
    return body?.error || fallback;
  } catch {
    return fallback;
  }
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
        setUser(null);
        return;
      }

      const data = await res.json();
      setUser(data.user || null);
      setError(null);
    } catch {
      setUser(null);
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
    return {
      message: data.message,
      requiresEmailVerification: Boolean(data.requiresEmailVerification),
      devVerificationToken:
        typeof data.devVerificationToken === 'string' ? data.devVerificationToken : undefined,
    };
  };

  const verifyEmail = async (token: string) => {
    const res = await fetchWithTimeout('/api/auth/verify-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ token }),
    });

    if (!res.ok) {
      const message = await parseApiError(res, 'Failed to verify email.');
      setError(message);
      throw new Error(message);
    }

    const data = await res.json();
    setError(null);
    return { message: data.message };
  };

  const resendVerification = async (email: string) => {
    const res = await fetchWithTimeout('/api/auth/resend-verification', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ email }),
    });

    if (!res.ok) {
      const message = await parseApiError(res, 'Failed to resend verification email.');
      setError(message);
      throw new Error(message);
    }

    const data = await res.json();
    setError(null);
    return {
      message: data.message,
      devVerificationToken:
        typeof data.devVerificationToken === 'string' ? data.devVerificationToken : undefined,
    };
  };

  const forgotPassword = async (email: string) => {
    const res = await fetchWithTimeout('/api/auth/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ email }),
    });

    if (!res.ok) {
      const message = await parseApiError(res, 'Failed to process password reset request.');
      setError(message);
      throw new Error(message);
    }

    const data = await res.json();
    setError(null);
    return {
      message: data.message,
      devResetToken: typeof data.devResetToken === 'string' ? data.devResetToken : undefined,
    };
  };

  const resetPassword = async (token: string, password: string) => {
    const res = await fetchWithTimeout('/api/auth/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ token, password }),
    });

    if (!res.ok) {
      const message = await parseApiError(res, 'Failed to reset password.');
      setError(message);
      throw new Error(message);
    }

    const data = await res.json();
    setError(null);
    return { message: data.message };
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
    () => ({
      user,
      isLoading,
      error,
      login,
      signup,
      verifyEmail,
      resendVerification,
      forgotPassword,
      resetPassword,
      logout,
      refreshSession,
      clearError,
    }),
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
