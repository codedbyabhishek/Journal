import { NextRequest, NextResponse } from 'next/server';
import { dbExecute, dbQuery } from '@/lib/server/db';
import { getCurrentUser } from '@/lib/server/auth';
import { jsonError } from '@/lib/server/http';

export const runtime = 'nodejs';

interface TradeRow {
  trade_id: string;
  trade_json: string;
}

function parseTradeRows(rows: TradeRow[]) {
  return rows
    .map((row) => {
      try {
        return JSON.parse(row.trade_json);
      } catch {
        return null;
      }
    })
    .filter(Boolean);
}

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return jsonError('Unauthorized', 401);
    }

    const searchParams = request.nextUrl.searchParams;
    const parsedLimit = Number(searchParams.get('limit') || 200);
    const parsedOffset = Number(searchParams.get('offset') || 0);

    const limit = Number.isFinite(parsedLimit)
      ? Math.min(Math.max(Math.floor(parsedLimit), 1), 500)
      : 200;
    const offset = Number.isFinite(parsedOffset)
      ? Math.max(Math.floor(parsedOffset), 0)
      : 0;

    const rows = await dbQuery<TradeRow[]>(
      `SELECT trade_id, trade_json
       FROM trades
       WHERE user_id = ?
       ORDER BY trade_date DESC, updated_at DESC
       LIMIT ? OFFSET ?`,
      [user.id, limit, offset]
    );

    const countRows = await dbQuery<{ total: number }[]>(
      'SELECT COUNT(*) AS total FROM trades WHERE user_id = ?',
      [user.id]
    );

    const total = Number(countRows[0]?.total || 0);
    const trades = parseTradeRows(rows);

    return NextResponse.json({
      trades,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + trades.length < total,
      },
    });
  } catch (error) {
    console.error('[trades/get] error', error);
    return jsonError('Failed to load trades.', 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return jsonError('Unauthorized', 401);
    }

    const body = await request.json();
    const trade = body?.trade;

    if (!trade || typeof trade !== 'object' || !trade.id || !trade.date) {
      return jsonError('Invalid trade payload.', 400);
    }

    const tradeJson = JSON.stringify(trade);
    const tradeDate = String(trade.date);

    await dbExecute(
      `INSERT INTO trades (user_id, trade_id, trade_json, trade_date, created_at, updated_at)
       VALUES (?, ?, ?, ?, NOW(), NOW())
       ON DUPLICATE KEY UPDATE
         trade_json = VALUES(trade_json),
         trade_date = VALUES(trade_date),
         updated_at = NOW()`,
      [user.id, String(trade.id), tradeJson, tradeDate]
    );

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('[trades/post] error', error);
    return jsonError('Failed to save trade.', 500);
  }
}
