interface AuthMailPayload {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

function isDevMode() {
  return process.env.NODE_ENV !== 'production';
}

function normalizeBaseUrl() {
  return (
    process.env.AUTH_BASE_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    'http://localhost:3000'
  ).replace(/\/$/, '');
}

export function buildVerifyEmailLink(token: string) {
  return `${normalizeBaseUrl()}/?verifyToken=${encodeURIComponent(token)}`;
}

export function buildResetPasswordLink(token: string) {
  return `${normalizeBaseUrl()}/?resetToken=${encodeURIComponent(token)}`;
}

export async function sendAuthMail(payload: AuthMailPayload) {
  const webhook = process.env.AUTH_EMAIL_WEBHOOK_URL;

  if (!webhook) {
    console.info('[auth-mail] webhook not configured; mail payload follows');
    console.info('[auth-mail]', { to: payload.to, subject: payload.subject, text: payload.text });
    return;
  }

  const res = await fetch(webhook, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    cache: 'no-store',
  });

  if (!res.ok) {
    throw new Error(`AUTH_EMAIL_WEBHOOK_FAILED_${res.status}`);
  }
}

export function maybeExposeTokenForDev(token: string): string | undefined {
  return isDevMode() ? token : undefined;
}
