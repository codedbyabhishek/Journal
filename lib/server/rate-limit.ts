import { NextRequest } from 'next/server';

interface RateLimitEntry {
  requests: number[];
  blockedUntil?: number;
}

interface RateLimitOptions {
  prefix: string;
  identifier: string;
  windowMs: number;
  maxRequests: number;
  blockDurationMs?: number;
}

interface RateLimitResult {
  allowed: boolean;
  retryAfterSeconds?: number;
  remaining: number;
}

declare global {
  // eslint-disable-next-line no-var
  var __tradingDiaryRateLimitStore: Map<string, RateLimitEntry> | undefined;
}

function getStore(): Map<string, RateLimitEntry> {
  if (!global.__tradingDiaryRateLimitStore) {
    global.__tradingDiaryRateLimitStore = new Map();
  }
  return global.__tradingDiaryRateLimitStore;
}

function normalizeIdentifier(value: string): string {
  return value.trim().toLowerCase() || 'unknown';
}

function cleanupOldRequests(entry: RateLimitEntry, now: number, windowMs: number) {
  entry.requests = entry.requests.filter((ts) => now - ts <= windowMs);
}

export function getClientIp(request: NextRequest): string {
  const xForwardedFor = request.headers.get('x-forwarded-for');
  if (xForwardedFor) {
    return xForwardedFor.split(',')[0]?.trim() || 'unknown';
  }

  const xRealIp = request.headers.get('x-real-ip');
  if (xRealIp) {
    return xRealIp.trim();
  }

  return 'unknown';
}

export function consumeRateLimit(options: RateLimitOptions): RateLimitResult {
  const {
    prefix,
    identifier,
    windowMs,
    maxRequests,
    blockDurationMs = windowMs,
  } = options;

  const store = getStore();
  const now = Date.now();
  const key = `${prefix}:${normalizeIdentifier(identifier)}`;
  const entry = store.get(key) || { requests: [] };

  if (entry.blockedUntil && entry.blockedUntil > now) {
    return {
      allowed: false,
      retryAfterSeconds: Math.ceil((entry.blockedUntil - now) / 1000),
      remaining: 0,
    };
  }

  cleanupOldRequests(entry, now, windowMs);

  if (entry.requests.length >= maxRequests) {
    entry.blockedUntil = now + blockDurationMs;
    store.set(key, entry);

    return {
      allowed: false,
      retryAfterSeconds: Math.ceil(blockDurationMs / 1000),
      remaining: 0,
    };
  }

  entry.requests.push(now);
  store.set(key, entry);

  return {
    allowed: true,
    remaining: Math.max(maxRequests - entry.requests.length, 0),
  };
}
