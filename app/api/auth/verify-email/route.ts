import { NextRequest, NextResponse } from 'next/server';
import { consumeEmailVerificationToken, validateVerifyEmailInput } from '@/lib/server/auth';
import { jsonError } from '@/lib/server/http';
import { toServerErrorResponse } from '@/lib/server/error-map';

export const runtime = 'nodejs';

async function processToken(token: string) {
  const userId = await consumeEmailVerificationToken(token);
  return userId !== null;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = validateVerifyEmailInput(body || {});

    if (!validated.valid) {
      return jsonError(validated.error, 400);
    }

    const ok = await processToken(validated.data.token);
    if (!ok) {
      return jsonError('Verification token is invalid or expired.', 400);
    }

    return NextResponse.json({ ok: true, message: 'Email verification successful. You can now login.' });
  } catch (error) {
    console.error('[auth/verify-email] error', error);
    const mapped = toServerErrorResponse(error, 'Failed to verify email.');
    return jsonError(mapped.message, mapped.status);
  }
}

export async function GET(request: NextRequest) {
  try {
    const token = request.nextUrl.searchParams.get('token') || '';
    const validated = validateVerifyEmailInput({ token });
    if (!validated.valid) {
      const redirectUrl = new URL('/?verified=invalid', request.url);
      return NextResponse.redirect(redirectUrl);
    }

    const ok = await processToken(validated.data.token);
    const redirectUrl = new URL(ok ? '/?verified=success' : '/?verified=invalid', request.url);
    return NextResponse.redirect(redirectUrl);
  } catch {
    const redirectUrl = new URL('/?verified=error', request.url);
    return NextResponse.redirect(redirectUrl);
  }
}
