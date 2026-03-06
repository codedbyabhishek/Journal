import { NextRequest, NextResponse } from 'next/server';
import { dbQuery } from '@/lib/server/db';
import {
  cleanupExpiredSessions,
  createSession,
  setSessionCookie,
  validateLoginInput,
  verifyPassword,
} from '@/lib/server/auth';
import { jsonError } from '@/lib/server/http';

export const runtime = 'nodejs';

interface UserRow {
  id: number;
  email: string;
  name: string | null;
  password_hash: string;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = validateLoginInput(body || {});

    if (!validated.valid) {
      return jsonError(validated.error, 400);
    }

    await cleanupExpiredSessions();

    const rows = await dbQuery<UserRow[]>(
      'SELECT id, email, name, password_hash FROM users WHERE email = ? LIMIT 1',
      [validated.data.email]
    );

    if (rows.length === 0) {
      return jsonError('Invalid email or password.', 401);
    }

    const user = rows[0];
    const passwordOk = await verifyPassword(validated.data.password, user.password_hash);

    if (!passwordOk) {
      return jsonError('Invalid email or password.', 401);
    }

    const sessionToken = await createSession(user.id);
    await setSessionCookie(sessionToken);

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    });
  } catch (error) {
    console.error('[auth/login] error', error);
    return jsonError('Failed to login.', 500);
  }
}
