import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/server/auth';
import { toServerErrorResponse } from '@/lib/server/error-map';

export const runtime = 'nodejs';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ user: null }, { status: 401 });
    }

    return NextResponse.json({ user });
  } catch (error) {
    console.error('[auth/me] error', error);
    const mapped = toServerErrorResponse(error, 'Failed to get session.');
    return NextResponse.json({ error: mapped.message }, { status: mapped.status });
  }
}
