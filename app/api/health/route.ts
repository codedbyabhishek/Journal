import { NextResponse } from 'next/server';
import { dbQuery } from '@/lib/server/db';
import { isDbUnavailableError } from '@/lib/server/error-map';

export const runtime = 'nodejs';

export async function GET() {
  const now = new Date().toISOString();

  try {
    await dbQuery('SELECT 1');

    return NextResponse.json(
      {
        status: 'ok',
        timestamp: now,
        checks: {
          app: 'ok',
          database: 'ok',
        },
      },
      { status: 200 },
    );
  } catch (error) {
    console.error('[health] error', error);

    const unavailable = isDbUnavailableError(error);

    return NextResponse.json(
      {
        status: unavailable ? 'degraded' : 'error',
        timestamp: now,
        checks: {
          app: 'ok',
          database: unavailable ? 'unavailable' : 'error',
        },
      },
      { status: unavailable ? 503 : 500 },
    );
  }
}
