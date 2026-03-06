'use client';

import { FormEvent, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function AuthScreen() {
  const { login, signup, error, clearError } = useAuth();
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [loading, setLoading] = useState(false);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    clearError();
    setLoading(true);

    try {
      if (mode === 'signup') {
        await signup(name, email, password);
      } else {
        await login(email, password);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md border-border bg-card">
        <CardHeader>
          <CardTitle>{mode === 'login' ? 'Login' : 'Create Account'}</CardTitle>
          <CardDescription>
            {mode === 'login'
              ? 'Sign in to access your trading journal.'
              : 'Create your account to store your data securely.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 mb-4">
            <Button
              type="button"
              variant={mode === 'login' ? 'default' : 'outline'}
              className="flex-1"
              onClick={() => {
                clearError();
                setMode('login');
              }}
            >
              Login
            </Button>
            <Button
              type="button"
              variant={mode === 'signup' ? 'default' : 'outline'}
              className="flex-1"
              onClick={() => {
                clearError();
                setMode('signup');
              }}
            >
              Sign Up
            </Button>
          </div>

          <form className="space-y-4" onSubmit={onSubmit}>
            {mode === 'signup' && (
              <div>
                <label className="block text-sm font-medium mb-1">Name (optional)</label>
                <input
                  className="w-full px-3 py-2 bg-input border border-border rounded-lg"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  maxLength={80}
                  placeholder="Your name"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium mb-1">Email</label>
              <input
                type="email"
                required
                className="w-full px-3 py-2 bg-input border border-border rounded-lg"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Password</label>
              <input
                type="password"
                required
                minLength={8}
                className="w-full px-3 py-2 bg-input border border-border rounded-lg"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 8 characters"
              />
            </div>

            {error && <p className="text-sm text-red-500">{error}</p>}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Please wait...' : mode === 'login' ? 'Login' : 'Create Account'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
