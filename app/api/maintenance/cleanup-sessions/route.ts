import { NextRequest, NextResponse } from 'next/server';
import { cleanupExpiredSessions } from '@/lib/server/auth';
import { jsonError } from '@/lib/server/http';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  const configuredToken = process.env.MAINTENANCE_TOKEN;

  if (!configuredToken) {
    return jsonError('Maintenance endpoint is not configured.', 503);
  }

  const token = request.headers.get('x-maintenance-token') || '';
  if (token !== configuredToken) {
    return jsonError('Unauthorized', 401);
  }

  try {
    await cleanupExpiredSessions();
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('[maintenance/cleanup-sessions] error', error);
    return jsonError('Failed to cleanup sessions.', 500);
  }
}
