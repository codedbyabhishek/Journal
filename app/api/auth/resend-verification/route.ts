import { NextRequest, NextResponse } from 'next/server';
import { dbQuery } from '@/lib/server/db';
import {
  createEmailVerificationToken,
  normalizeAuthEmail,
  validatePasswordResetRequestInput,
} from '@/lib/server/auth';
import { consumeRateLimit, getClientIp } from '@/lib/server/rate-limit';
import { jsonError } from '@/lib/server/http';
import { toServerErrorResponse } from '@/lib/server/error-map';
import {
  buildVerifyEmailLink,
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
      prefix: 'auth-resend-verify-ip',
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

    const email = normalizeAuthEmail(validated.data.email);
    const rows = await dbQuery<{ id: number; email: string; email_verified_at: string | null }[]>(
      'SELECT id, email, email_verified_at FROM users WHERE email = ? LIMIT 1',
      [email]
    );

    let devVerificationToken: string | undefined;

    if (rows.length > 0 && rows[0].email_verified_at === null) {
      const token = await createEmailVerificationToken(rows[0].id);
      const verifyLink = buildVerifyEmailLink(token);
      devVerificationToken = maybeExposeTokenForDev(token);

      await sendAuthMail({
        to: rows[0].email,
        subject: 'Verify your Trading Journal account',
        text: `Verify your account using this link: ${verifyLink}`,
        html: `<p>Verify your account by clicking the link below:</p><p><a href="${verifyLink}">${verifyLink}</a></p>`,
      });
    }

    return NextResponse.json({
      ok: true,
      message: 'If the account exists and is unverified, a verification email has been sent.',
      devVerificationToken,
    });
  } catch (error) {
    console.error('[auth/resend-verification] error', error);
    const mapped = toServerErrorResponse(error, 'Failed to resend verification email.');
    return jsonError(mapped.message, mapped.status);
  }
}
