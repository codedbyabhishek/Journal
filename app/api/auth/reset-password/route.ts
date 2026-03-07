import { NextRequest, NextResponse } from 'next/server';
import { consumeRateLimit, getClientIp } from '@/lib/server/rate-limit';
import {
  consumePasswordResetToken,
  hashPassword,
  validateResetPasswordInput,
} from '@/lib/server/auth';
import { jsonError } from '@/lib/server/http';
import { toServerErrorResponse } from '@/lib/server/error-map';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = validateResetPasswordInput(body || {});
    if (!validated.valid) {
      return jsonError(validated.error, 400);
    }

    const ip = getClientIp(request);
    const byIpLimit = await consumeRateLimit({
      prefix: 'auth-reset-ip',
      identifier: ip,
      windowMs: 15 * 60 * 1000,
      maxRequests: 15,
      blockDurationMs: 15 * 60 * 1000,
    });

    if (!byIpLimit.allowed) {
      return jsonError('Too many requests. Please wait and try again.', 429, {
        'Retry-After': String(byIpLimit.retryAfterSeconds || 60),
      });
    }

    const passwordHash = await hashPassword(validated.data.password);
    const userId = await consumePasswordResetToken(validated.data.token, passwordHash);

    if (!userId) {
      return jsonError('Reset token is invalid or expired.', 400);
    }

    return NextResponse.json({ ok: true, message: 'Password reset successful. Please login.' });
  } catch (error) {
    console.error('[auth/reset-password] error', error);
    const mapped = toServerErrorResponse(error, 'Failed to reset password.');
    return jsonError(mapped.message, mapped.status);
  }
}
