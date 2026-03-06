import { NextRequest, NextResponse } from 'next/server';
import { ResultSetHeader } from 'mysql2';
import { dbExecute, dbQuery } from '@/lib/server/db';
import {
  cleanupExpiredSessions,
  createSession,
  hashPassword,
  setSessionCookie,
  validateSignupInput,
} from '@/lib/server/auth';
import { jsonError } from '@/lib/server/http';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = validateSignupInput(body || {});

    if (!validated.valid) {
      return jsonError(validated.error, 400);
    }

    await cleanupExpiredSessions();

    const existing = await dbQuery<{ id: number }[]>(
      'SELECT id FROM users WHERE email = ? LIMIT 1',
      [validated.data.email]
    );

    if (existing.length > 0) {
      return jsonError('Email is already registered.', 409);
    }

    const passwordHash = await hashPassword(validated.data.password);

    const result = (await dbExecute(
      `INSERT INTO users (email, password_hash, name, created_at, updated_at)
       VALUES (?, ?, ?, NOW(), NOW())`,
      [validated.data.email, passwordHash, validated.data.name]
    )) as ResultSetHeader;

    const userId = Number(result.insertId);
    const sessionToken = await createSession(userId);
    await setSessionCookie(sessionToken);

    return NextResponse.json(
      {
        user: {
          id: userId,
          email: validated.data.email,
          name: validated.data.name,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('[auth/signup] error', error);
    return jsonError('Failed to create account.', 500);
  }
}
