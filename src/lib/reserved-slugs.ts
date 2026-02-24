// Copyright (c) 2026 Jérémy Vtipil
// Licensed under the GNU Affero General Public License v3.0

/**
 * Slugs that cannot be used as tenant subdomains.
 * These conflict with application routes, infrastructure, or common services.
 */
export const RESERVED_SLUGS = new Set([
  // Application routes
  "admin",
  "api",
  "platform",
  "signup",
  "login",
  "home",
  "not-found",

  // Common infrastructure
  "www",
  "mail",
  "ftp",
  "cdn",
  "assets",
  "static",
  "media",
  "uploads",

  // Common services
  "demo",
  "test",
  "staging",
  "blog",
  "docs",
  "help",
  "support",
  "status",
  "billing",
  "app",
  "dashboard",
]);
