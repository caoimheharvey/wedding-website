import "server-only";

interface MockToken {
  guestId: string;
  tokenHash: string;
  expiresAt: Date;
  usedAt: Date | null;
}

/**
 * In-memory magic-link tokens used only when LOCAL_TEST_BYPASS_AUTH is set.
 * Resets on every dev server restart — intentional, no persistence needed.
 *
 * Stashed on globalThis rather than a plain module-level `let`: Server
 * Actions and Route Handlers can end up in separate Turbopack dev bundles,
 * which would otherwise give each its own copy of this module and make
 * tokens written by one invisible to the other.
 */
const globalForTokens = globalThis as unknown as { __guestLoginTokens?: MockToken[] };
if (!globalForTokens.__guestLoginTokens) globalForTokens.__guestLoginTokens = [];

export function mockCreateGuestLoginToken(guestId: string, tokenHash: string, expiresAt: Date): void {
  globalForTokens.__guestLoginTokens!.push({ guestId, tokenHash, expiresAt, usedAt: null });
}

/** Verifies and single-use-consumes a token, returning the guest id if valid. */
export function mockConsumeGuestLoginToken(tokenHash: string): string | null {
  const tokens = globalForTokens.__guestLoginTokens!;
  const token = tokens.find((entry) => entry.tokenHash === tokenHash);
  if (!token) return null;
  if (token.usedAt) return null;
  if (token.expiresAt < new Date()) return null;

  token.usedAt = new Date();
  return token.guestId;
}
