// Copyright (c) 2026 Jérémy Vtipil
// Licensed under the GNU Affero General Public License v3.0

/**
 * Centralized environment variable validation.
 * Imported at startup (via db.ts) to catch misconfigurations early.
 */

const isProd = process.env.NODE_ENV === "production";

// Critical — app cannot function without these
if (isProd && !process.env.JWT_SECRET) {
  throw new Error("Missing required environment variable: JWT_SECRET");
}
if (isProd && !process.env.DATABASE_URL) {
  throw new Error("Missing required environment variable: DATABASE_URL");
}

// Storage — critical for uploads
if (isProd && !process.env.S3_ENDPOINT) {
  throw new Error("Missing required environment variable: S3_ENDPOINT");
}
if (isProd && !process.env.S3_BUCKET) {
  throw new Error("Missing required environment variable: S3_BUCKET");
}
if (isProd && !process.env.S3_ACCESS_KEY) {
  throw new Error("Missing required environment variable: S3_ACCESS_KEY");
}
if (isProd && !process.env.S3_SECRET_KEY) {
  throw new Error("Missing required environment variable: S3_SECRET_KEY");
}
if (isProd && !process.env.MEDIA_BASE_URL) {
  throw new Error("Missing required environment variable: MEDIA_BASE_URL");
}

// Recommended — app works but with degraded behavior
if (isProd && !process.env.ANALYTICS_SALT) {
  console.warn("env: ANALYTICS_SALT not set — using default (not recommended for production)");
}

// Email — optional (password reset disabled without these)
if (isProd && !process.env.MAILGUN_API_KEY) {
  console.warn("env: MAILGUN_API_KEY not set — emails will be logged to console");
}

// Sentry — optional (error tracking disabled without DSN)
if (isProd && !process.env.SENTRY_DSN) {
  console.warn("env: SENTRY_DSN not set — error tracking will be disabled");
}
