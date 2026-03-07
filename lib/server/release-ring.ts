function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function parseAllowedEmails(raw: string): Set<string> {
  return new Set(
    raw
      .split(',')
      .map((value) => normalizeEmail(value))
      .filter(Boolean)
  );
}

export function isBetaAllowlistEnabled(): boolean {
  return process.env.BETA_ALLOWLIST_ENABLED === 'true';
}

export function isEmailAllowedForBeta(email: string): boolean {
  if (!isBetaAllowlistEnabled()) {
    return true;
  }

  const raw = process.env.BETA_ALLOWED_EMAILS || '';
  const allowedEmails = parseAllowedEmails(raw);

  // Safe default: deny when allowlist mode is enabled but list is empty.
  if (allowedEmails.size === 0) {
    return false;
  }

  return allowedEmails.has(normalizeEmail(email));
}

export function betaAccessDeniedMessage(): string {
  return 'This beta release is currently limited to invited users.';
}
