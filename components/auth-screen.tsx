'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import SiteFooter from '@/components/site-footer';

type AuthMode = 'login' | 'signup' | 'forgot' | 'reset';

export default function AuthScreen() {
  const {
    login,
    signup,
    verifyEmail,
    resendVerification,
    forgotPassword,
    resetPassword,
    error,
    clearError,
  } = useAuth();

  const [mode, setMode] = useState<AuthMode>('login');
  const [loading, setLoading] = useState(false);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [verificationToken, setVerificationToken] = useState('');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [devTokenHint, setDevTokenHint] = useState<string | null>(null);

  const isRateLimitError = !!error && error.toLowerCase().includes('too many');
  const isServiceError = !!error && error.toLowerCase().includes('temporarily unavailable');

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const params = new URLSearchParams(window.location.search);
    const resetTokenParam = params.get('resetToken') || '';
    const verifyTokenParam = params.get('verifyToken') || '';
    const verifiedStatus = params.get('verified') || '';

    if (resetTokenParam) {
      setMode('reset');
      setResetToken(resetTokenParam);
      setStatusMessage('Reset token detected. Set your new password.');
    }

    if (verifyTokenParam) {
      setVerificationToken(verifyTokenParam);
      void (async () => {
        try {
          clearError();
          setLoading(true);
          const result = await verifyEmail(verifyTokenParam);
          setStatusMessage(result.message || 'Email verified. You can now login.');
        } catch {
          // Error surfaced via auth context.
        } finally {
          setLoading(false);
        }
      })();
    } else if (verifiedStatus === 'success') {
      setStatusMessage('Email verified. You can now login.');
    } else if (verifiedStatus === 'invalid') {
      setStatusMessage('Verification link is invalid or expired. Request a new one.');
    } else if (verifiedStatus === 'error') {
      setStatusMessage('Unable to verify email right now. Please try again.');
    }
  }, [verifyEmail, clearError]);

  const switchMode = (nextMode: AuthMode) => {
    clearError();
    setStatusMessage(null);
    setDevTokenHint(null);
    setMode(nextMode);
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    clearError();
    setStatusMessage(null);
    setDevTokenHint(null);
    setLoading(true);

    try {
      if (mode === 'signup') {
        const result = await signup(name, email, password);
        setStatusMessage(
          result.message ||
            'Account created. Please verify your email before login.'
        );
        if (result.devVerificationToken) {
          setDevTokenHint(result.devVerificationToken);
          setVerificationToken(result.devVerificationToken);
        }
        setMode('login');
      } else if (mode === 'forgot') {
        const result = await forgotPassword(email);
        setStatusMessage(result.message || 'Password reset link sent if account exists.');
        if (result.devResetToken) {
          setDevTokenHint(result.devResetToken);
          setResetToken(result.devResetToken);
          setMode('reset');
        }
      } else if (mode === 'reset') {
        if (password !== confirmPassword) {
          throw new Error('Passwords do not match.');
        }
        const result = await resetPassword(resetToken, password);
        setStatusMessage(result.message || 'Password reset successful. Please login.');
        setPassword('');
        setConfirmPassword('');
        setResetToken('');
        setMode('login');
      } else {
        await login(email, password);
      }
    } catch (err) {
      if (err instanceof Error && err.message) {
        setStatusMessage(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const onVerifyToken = async () => {
    clearError();
    setStatusMessage(null);
    setLoading(true);
    try {
      const result = await verifyEmail(verificationToken);
      setStatusMessage(result.message || 'Email verified. You can now login.');
    } catch {
      // Error shown via auth context
    } finally {
      setLoading(false);
    }
  };

  const onResendVerification = async () => {
    clearError();
    setStatusMessage(null);
    setDevTokenHint(null);
    setLoading(true);
    try {
      const result = await resendVerification(email);
      setStatusMessage(result.message || 'Verification email sent if account exists.');
      if (result.devVerificationToken) {
        setDevTokenHint(result.devVerificationToken);
        setVerificationToken(result.devVerificationToken);
      }
    } catch {
      // Error shown via auth context
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-background p-4 sm:p-8 overflow-y-auto overflow-x-hidden">
      <div className="mx-auto max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        <Card className="border-border bg-card relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-background to-background pointer-events-none" />
          <CardHeader className="relative z-10 p-8">
            <p className="text-xs font-semibold uppercase tracking-widest text-primary">Trading Journal</p>
            <CardTitle className="text-3xl sm:text-4xl leading-tight mt-3">
              Build Consistency With Data, Not Guesswork
            </CardTitle>
            <CardDescription className="text-sm sm:text-base mt-2 max-w-lg">
              Track every trade, analyze your edge, and improve your process with structured review.
            </CardDescription>
          </CardHeader>
          <CardContent className="relative z-10 p-8 pt-0 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="rounded-xl border border-border bg-background/80 p-3">
                <p className="text-xs text-muted-foreground">Journaling</p>
                <p className="text-lg font-semibold">Fast Entry</p>
              </div>
              <div className="rounded-xl border border-border bg-background/80 p-3">
                <p className="text-xs text-muted-foreground">Analytics</p>
                <p className="text-lg font-semibold">Deep Review</p>
              </div>
              <div className="rounded-xl border border-border bg-background/80 p-3">
                <p className="text-xs text-muted-foreground">Storage</p>
                <p className="text-lg font-semibold">Cloud + MySQL</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="w-full border-border bg-card self-center">
          <CardHeader>
            <CardTitle>
              {mode === 'login' && 'Welcome Back'}
              {mode === 'signup' && 'Create Your Account'}
              {mode === 'forgot' && 'Reset Password'}
              {mode === 'reset' && 'Set New Password'}
            </CardTitle>
            <CardDescription>
              {mode === 'login' && 'Login to continue your trading review workflow.'}
              {mode === 'signup' && 'Signup and verify email to protect account access.'}
              {mode === 'forgot' && 'Enter your email to receive a password reset link.'}
              {mode === 'reset' && 'Enter your reset token and choose a new password.'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2 mb-4">
              <Button type="button" variant={mode === 'login' ? 'default' : 'outline'} className="flex-1" onClick={() => switchMode('login')}>
                Login
              </Button>
              <Button type="button" variant={mode === 'signup' ? 'default' : 'outline'} className="flex-1" onClick={() => switchMode('signup')}>
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

              {(mode === 'login' || mode === 'signup' || mode === 'forgot') && (
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
              )}

              {(mode === 'login' || mode === 'signup') && (
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
              )}

              {mode === 'reset' && (
                <>
                  <div>
                    <label className="block text-sm font-medium mb-1">Reset token</label>
                    <input
                      required
                      className="w-full px-3 py-2 bg-input border border-border rounded-lg"
                      value={resetToken}
                      onChange={(e) => setResetToken(e.target.value)}
                      placeholder="Paste reset token"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">New password</label>
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
                  <div>
                    <label className="block text-sm font-medium mb-1">Confirm password</label>
                    <input
                      type="password"
                      required
                      minLength={8}
                      className="w-full px-3 py-2 bg-input border border-border rounded-lg"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Repeat password"
                    />
                  </div>
                </>
              )}

              {(error || statusMessage) && (
                <div
                  className={`rounded-lg border px-3 py-2 text-sm ${
                    isRateLimitError
                      ? 'border-amber-500/40 bg-amber-500/10 text-amber-300'
                      : isServiceError
                      ? 'border-orange-500/40 bg-orange-500/10 text-orange-300'
                      : 'border-blue-500/40 bg-blue-500/10 text-blue-300'
                  }`}
                >
                  {error || statusMessage}
                </div>
              )}

              {devTokenHint && (
                <div className="rounded-lg border border-purple-500/30 bg-purple-500/10 text-purple-200 px-3 py-2 text-xs break-all">
                  Dev token preview: {devTokenHint}
                </div>
              )}

              <Button type="submit" className="w-full" disabled={loading}>
                {loading
                  ? 'Please wait...'
                  : mode === 'login'
                  ? 'Login'
                  : mode === 'signup'
                  ? 'Create Account'
                  : mode === 'forgot'
                  ? 'Send Reset Link'
                  : 'Reset Password'}
              </Button>
            </form>

            <div className="mt-4 flex flex-wrap gap-3 text-sm">
              {mode === 'login' && (
                <button type="button" className="text-primary hover:underline" onClick={() => switchMode('forgot')}>
                  Forgot password?
                </button>
              )}
              {mode === 'forgot' && (
                <button type="button" className="text-primary hover:underline" onClick={() => switchMode('login')}>
                  Back to login
                </button>
              )}
              {mode === 'reset' && (
                <button type="button" className="text-primary hover:underline" onClick={() => switchMode('login')}>
                  Back to login
                </button>
              )}
            </div>

            {(mode === 'login' || mode === 'signup') && (
              <div className="mt-6 border-t border-border pt-4 space-y-3">
                <p className="text-sm font-medium">Email verification</p>
                <input
                  className="w-full px-3 py-2 bg-input border border-border rounded-lg"
                  value={verificationToken}
                  onChange={(e) => setVerificationToken(e.target.value)}
                  placeholder="Paste verification token"
                />
                <div className="flex flex-wrap gap-2">
                  <Button type="button" variant="outline" onClick={onVerifyToken} disabled={loading || !verificationToken.trim()}>
                    Verify Email Token
                  </Button>
                  <Button type="button" variant="outline" onClick={onResendVerification} disabled={loading || !email.trim()}>
                    Resend Verification
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <SiteFooter />
    </div>
  );
}
