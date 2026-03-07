import { NextRequest, NextResponse } from 'next/server';
import { dbQuery } from '@/lib/server/db';
import {
  createPasswordResetToken,
  validatePasswordResetRequestInput,
} from '@/lib/server/auth';
import { consumeRateLimit, getClientIp } from '@/lib/server/rate-limit';
import { jsonError } from '@/lib/server/http';
import { toServerErrorResponse } from '@/lib/server/error-map';
import {
  buildResetPasswordLink,
  maybeExposeTokenForDev,
  sendAuthMail,
} from '@/lib/server/auth-mail';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = validatePasswordResetRequestInput(body || {});
    if (!validated.valid) {
      return jsonError(validated.error, 400);
    }

    const ip = getClientIp(request);
    const byIpLimit = await consumeRateLimit({
      prefix: 'auth-forgot-ip',
      identifier: ip,
      windowMs: 15 * 60 * 1000,
      maxRequests: 10,
      blockDurationMs: 15 * 60 * 1000,
    });
    if (!byIpLimit.allowed) {
      return jsonError('Too many requests. Please wait and try again.', 429, {
        'Retry-After': String(byIpLimit.retryAfterSeconds || 60),
      });
    }

    const rows = await dbQuery<{ id: number; email: string }[]>(
      'SELECT id, email FROM users WHERE email = ? LIMIT 1',
      [validated.data.email]
    );

    let devResetToken: string | undefined;

    if (rows.length > 0) {
      const user = rows[0];
      const token = await createPasswordResetToken(user.id);
      const resetLink = buildResetPasswordLink(token);
      devResetToken = maybeExposeTokenForDev(token);

      await sendAuthMail({
        to: user.email,
        subject: 'Reset your Trading Journal password',
        text: `Reset your password using this link: ${resetLink}`,
        html: `<p>Reset your password by clicking the link below:</p><p><a href="${resetLink}">${resetLink}</a></p>`,
      });
    }

    return NextResponse.json({
      ok: true,
      message: 'If the email exists, a password reset link has been sent.',
      devResetToken,
    });
  } catch (error) {
    console.error('[auth/forgot-password] error', error);
    const mapped = toServerErrorResponse(error, 'Failed to process password reset request.');
    return jsonError(mapped.message, mapped.status);
  }
}
