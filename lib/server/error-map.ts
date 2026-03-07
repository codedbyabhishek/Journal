interface ErrorWithCode {
  code?: string;
  message?: string;
}

const DB_UNAVAILABLE_CODES = new Set([
  'ECONNREFUSED',
  'ETIMEDOUT',
  'ENOTFOUND',
  'EHOSTUNREACH',
  'PROTOCOL_CONNECTION_LOST',
  'PROTOCOL_ENQUEUE_AFTER_FATAL_ERROR',
  'ER_CON_COUNT_ERROR',
  'ER_ACCESS_DENIED_ERROR',
]);

function asErrorWithCode(error: unknown): ErrorWithCode {
  if (error && typeof error === 'object') {
    return error as ErrorWithCode;
  }
  return {};
}

export function isDbUnavailableError(error: unknown): boolean {
  const { code, message } = asErrorWithCode(error);
  if (code && DB_UNAVAILABLE_CODES.has(code)) {
    return true;
  }

  if (typeof message === 'string') {
    const normalized = message.toLowerCase();
    if (
      normalized.includes('access denied for user') ||
      normalized.includes('connect') ||
      normalized.includes('connection') ||
      normalized.includes('timeout')
    ) {
      return true;
    }
  }

  return false;
}

export function toServerErrorResponse(error: unknown, fallbackMessage: string) {
  if (isDbUnavailableError(error)) {
    return {
      status: 503,
      message: 'Service temporarily unavailable. Please try again shortly.',
    };
  }

  return {
    status: 500,
    message: fallbackMessage,
  };
}
