// Copyright (c) 2026 Jérémy Vtipil
// Licensed under the GNU Affero General Public License v3.0

import { z } from "zod/v4";

// ============================================================
// Shared constants — SSOT for enum-like values
// ============================================================

export const PORTFOLIO_LAYOUTS = ["standard", "fullscreen"] as const;
export const OVERLAY_ANIMATIONS = ["fade", "slide"] as const;
export const TRANSITION_STYLES = ["slide-up", "crossfade"] as const;
export const OVERLAY_POSITIONS = [
  "top-left",
  "top-right",
  "bottom-left",
  "bottom-right",
  "hidden",
] as const;
export const PAGE_TEMPLATES = ["text-centered", "text-wide", "text-columns", "masonry"] as const;
export const FONT_SOURCES = ["system", "google", "custom"] as const;

export type PortfolioLayout = (typeof PORTFOLIO_LAYOUTS)[number];
export type OverlayAnimation = (typeof OVERLAY_ANIMATIONS)[number];
export type TransitionStyle = (typeof TRANSITION_STYLES)[number];
export type OverlayPosition = (typeof OVERLAY_POSITIONS)[number];
export type PageTemplate = (typeof PAGE_TEMPLATES)[number];
export type FontSource = (typeof FONT_SOURCES)[number];

// ============================================================
// Reusable field schemas
// ============================================================

const slug = z.string().min(1).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Invalid slug format");
const hexColor = z.string().regex(/^#[0-9a-fA-F]{6}$/, "Invalid hex color");
const optionalUrl = z.string().url().optional().or(z.literal(""));
const domainName = z
  .string()
  .min(3)
  .max(253)
  .regex(/^([a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$/, "Invalid domain")
  .optional()
  .or(z.literal(""));

// ============================================================
// API route schemas
// ============================================================

export const loginSchema = z.object({
  email: z.email(),
  password: z.string().min(1),
});

export const tenantUpdateSchema = z.object({
  name: z.string().min(1).optional(),
  bio: z.string().optional(),
  email: z.email().optional().or(z.literal("")),
  primaryColor: hexColor.optional(),
  bgColor: hexColor.optional(),
  fontFamily: z.string().regex(/^[a-zA-Z0-9 \-'.]+$/, "Invalid font family name").optional().or(z.literal("")),
  fontSource: z.enum(FONT_SOURCES).optional(),
  portfolioLayout: z.enum(PORTFOLIO_LAYOUTS).optional(),
  homePosition: z.enum(OVERLAY_POSITIONS).optional(),
  navPosition: z.enum(OVERLAY_POSITIONS).optional(),
  titlePosition: z.enum(OVERLAY_POSITIONS).optional(),
  aboutPosition: z.enum(OVERLAY_POSITIONS).optional(),
  aboutPageId: z.string().optional(),
  homePageId: z.string().optional(),
  overlayAnimation: z.enum(OVERLAY_ANIMATIONS).optional(),
  navAutoExpand: z.boolean().optional(),
  navLabel: z.string().min(1).max(30).optional(),
  aboutLabel: z.string().min(1).max(30).optional(),
  transitionStyle: z.enum(TRANSITION_STYLES).optional(),
  heroDuration: z.coerce.number().int().min(0).max(30).optional(),
  logoUrl: z.string().optional(),
  faviconUrl: z.string().optional(),
  instagramUrl: optionalUrl,
  behanceUrl: optionalUrl,
  linkedinUrl: optionalUrl,
  websiteUrl: optionalUrl,
  domain: domainName,
});

export const categoryCreateSchema = z.object({
  name: z.string().min(1),
  slug,
});

export const projectCreateSchema = z.object({
  title: z.string().min(1),
  slug,
  categoryId: z.string().min(1),
  description: z.string().optional(),
});

export const projectUpdateSchema = z.object({
  title: z.string().min(1).optional(),
  slug: slug.optional(),
  categoryId: z.string().min(1).optional(),
  description: z.string().optional(),
  published: z.boolean().optional(),
});

export const pageCreateSchema = z.object({
  title: z.string().min(1),
  slug,
  content: z.string().optional(),
  template: z.enum(PAGE_TEMPLATES).optional(),
  columns: z.number().int().min(1).max(4).optional(),
  showTitle: z.boolean().optional(),
});

export const pageUpdateSchema = z.object({
  title: z.string().min(1).optional(),
  slug: slug.optional(),
  content: z.string().optional(),
  published: z.boolean().optional(),
  sortOrder: z.number().int().min(0).optional(),
  template: z.enum(PAGE_TEMPLATES).optional(),
  columns: z.number().int().min(1).max(4).optional(),
  showTitle: z.boolean().optional(),
});

export const categoryUpdateSchema = z.object({
  name: z.string().min(1).optional(),
  columnCount: z.number().int().min(1).max(4).optional(),
});

export const reorderSchema = z.array(
  z.object({
    id: z.string().min(1),
    sortOrder: z.number().int().min(0),
  })
);

export const mediaUpdateSchema = z.object({
  altText: z.string().optional(),
  sortOrder: z.number().int().min(0).optional(),
});

// ============================================================
// Column block types for text-columns template
// ============================================================

export const COLUMN_LAYOUTS = [
  "1-1", "1-2", "2-1", "1-3", "3-1",
  "1-1-1", "1-2-1",
  "1-1-1-1",
] as const;

export type ColumnLayout = (typeof COLUMN_LAYOUTS)[number];

export function layoutToGridCols(layout: string): string {
  return layout.split("-").map((n) => `${n}fr`).join(" ");
}

export function layoutColCount(layout: string): number {
  return layout.split("-").length;
}

export const columnBlockSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("text"), content: z.string() }),
  z.object({ type: z.literal("media"), mediaId: z.string().min(1) }),
]);

export type ColumnBlock = z.infer<typeof columnBlockSchema>;

// ============================================================
// JWT payload
// ============================================================

export const ROLES = ["ADMIN", "SUPER_ADMIN"] as const;
export type Role = (typeof ROLES)[number];
export const ROLE_SUPER_ADMIN: Role = "SUPER_ADMIN";

export const jwtPayloadSchema = z.object({
  userId: z.string(),
  tenantId: z.string(),
  role: z.enum(ROLES).optional(),
});

export const signupSchema = z.object({
  slug: slug,
  name: z.string().min(1).max(100),
  email: z.email(),
  password: z.string().min(8),
});

export const checkSlugSchema = z.object({
  slug: slug,
});

export const forgotPasswordSchema = z.object({
  email: z.email(),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1),
  password: z.string().min(8),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8),
});

export const changeEmailSchema = z.object({
  newEmail: z.email(),
  password: z.string().min(1),
});

export const deleteAccountSchema = z.object({
  slug: z.string().min(1),
  password: z.string().min(1),
});

export const tenantCreateSchema = z.object({
  slug: slug,
  name: z.string().min(1),
  bio: z.string().optional(),
  email: z.email().optional().or(z.literal("")),
  primaryColor: hexColor.optional(),
  bgColor: hexColor.optional(),
  adminEmail: z.email(),
  adminPassword: z.string().min(8),
});

export const platformTenantUpdateSchema = z.object({
  name: z.string().min(1).optional(),
  featured: z.boolean().optional(),
  domain: domainName,
});

// ============================================================
// File upload MIME whitelist
// ============================================================

export const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "image/svg+xml",
  "video/mp4",
  "video/webm",
]);

/** Upload limits per resource type */
export const UPLOAD_LIMITS = {
  media: { maxSize: 50 * 1024 * 1024 },          // 50 MB
  font: { maxSize: 2 * 1024 * 1024 },             // 2 MB
} as const;


// ============================================================
// Analytics
// ============================================================

export const PAGE_TYPES = ["home", "category", "project", "page"] as const;
export type PageType = (typeof PAGE_TYPES)[number];

export const ANALYTICS_PERIODS = ["7d", "30d", "90d"] as const;
export type AnalyticsPeriod = (typeof ANALYTICS_PERIODS)[number];

export const analyticsQuerySchema = z.object({
  period: z.enum(ANALYTICS_PERIODS).default("30d"),
  pageType: z.enum(PAGE_TYPES).optional(),
  resourceId: z.string().optional(),
});

export const trackEventSchema = z.object({
  path: z.string().min(1).max(500),
  pageType: z.enum(PAGE_TYPES),
  resourceId: z.string().optional(),
  referrer: z.string().max(2000).optional(),
});

// ============================================================
// Type-safe accessors for Prisma String fields with defaults
// ============================================================

const PORTFOLIO_LAYOUT_SET = new Set<string>(PORTFOLIO_LAYOUTS);
const OVERLAY_POSITION_SET = new Set<string>(OVERLAY_POSITIONS);

export function safeLayout(value: string): PortfolioLayout {
  return PORTFOLIO_LAYOUT_SET.has(value) ? (value as PortfolioLayout) : "standard";
}

export function safePosition(value: string, fallback: OverlayPosition = "hidden"): OverlayPosition {
  return OVERLAY_POSITION_SET.has(value) ? (value as OverlayPosition) : fallback;
}
