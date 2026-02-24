// Copyright (c) 2026 Jérémy Vtipil
// Licensed under the GNU Affero General Public License v3.0

/**
 * Simple in-memory rate limiter for auth endpoints.
 * Tracks attempts per key (IP or email) within a sliding window.
 *
 * Note: In-memory store is lost on server restart.
 * Acceptable for single-server deployments; use Redis for multi-server.
 */

export const RATE_LIMITS = {
  login: { maxAttempts: 10, windowMs: 15 * 60 * 1000 },           // 10 attempts / 15 min
  signup: { maxAttempts: 5, windowMs: 60 * 60 * 1000 },            // 5 attempts / 1 hour
  forgotPassword: { maxAttempts: 3, windowMs: 15 * 60 * 1000 },    // 3 attempts / 15 min
  resendVerification: { maxAttempts: 3, windowMs: 15 * 60 * 1000 }, // 3 attempts / 15 min
} as const;

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const store = new Map<string, RateLimitEntry>();

// Clean up expired entries periodically
const CLEANUP_INTERVAL = 60_000;
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of store) {
    if (now > entry.resetAt) {
      store.delete(key);
    }
  }
}, CLEANUP_INTERVAL);

/**
 * Check if a key has exceeded the rate limit.
 * @returns `{ limited: false }` if allowed, or `{ limited: true, retryAfter }` if blocked.
 */
export function checkRateLimit(
  key: string,
  maxAttempts: number,
  windowMs: number
): { limited: false } | { limited: true; retryAfter: number } {
  const now = Date.now();
  const entry = store.get(key);

  if (!entry || now > entry.resetAt) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return { limited: false };
  }

  entry.count++;
  if (entry.count > maxAttempts) {
    const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
    return { limited: true, retryAfter };
  }

  return { limited: false };
}
