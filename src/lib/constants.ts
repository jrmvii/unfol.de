// Copyright (c) 2026 Jérémy Vtipil
// Licensed under the GNU Affero General Public License v3.0

/** Overlay slide-in/slide-out animation duration in ms */
export const OVERLAY_SLIDE_MS = 700;

/** Hero leaving-phase fade-out duration in ms */
export const HERO_FADEOUT_MS = 600;

/** Toast auto-dismiss duration in ms */
export const TOAST_DISMISS_MS = 3000;

/** Shared CSS transition string for overlay color changes */
export const COLOR_TRANSITION = "0.3s ease";

/** Root directory for user-uploaded files */
export const UPLOAD_DIR = process.env.UPLOAD_DIR || "./uploads";

/** Password reset token expiry in milliseconds (1 hour) */
export const TOKEN_EXPIRY_MS = 60 * 60 * 1000;

/** Tenant cookie max age in seconds (1 day) */
export const TENANT_COOKIE_MAX_AGE = 60 * 60 * 24;

/** Auth cookie max age in seconds (7 days) */
export const AUTH_COOKIE_MAX_AGE = 60 * 60 * 24 * 7;

/** Root domains — empty in self-hosted mode (no subdomain routing) */
export const ROOT_DOMAINS: string[] = [];

const SITE_BASE = process.env.SITE_URL || "http://localhost:3000";

/**
 * Build a root-domain URL (for password reset links, etc.).
 */
export function buildRootUrl(path: string): string {
  return `${SITE_BASE}${path}`;
}

/**
 * Build an admin dashboard URL for a given tenant slug.
 */
export function buildAdminUrl(_slug: string): string {
  return `${SITE_BASE}/admin`;
}

/**
 * Build a tenant-scoped URL for a given slug and path.
 */
export function buildTenantUrl(_slug: string, path: string): string {
  return `${SITE_BASE}${path}`;
}
