// Copyright (c) 2026 Jérémy Vtipil
// Licensed under the GNU Affero General Public License v3.0

import { SignJWT, jwtVerify } from "jose";
import { createHash } from "crypto";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { db } from "./db";
import { jwtPayloadSchema, ROLE_SUPER_ADMIN } from "./schemas";

// JWT_SECRET validation is in lib/env.ts (imported via db.ts at startup)
const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "dev-secret-do-not-use-in-prod"
);
const COOKIE_NAME = "unfolde-token";
const TENANT_COOKIE = "unfolde-tenant";

export async function login(email: string, password: string) {
  const user = await db.user.findUnique({
    where: { email },
    include: { tenant: true },
  });
  if (!user || !(await bcrypt.compare(password, user.password))) {
    return null;
  }

  const token = await new SignJWT({
    userId: user.id,
    tenantId: user.tenantId,
    role: user.role,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("7d")
    .sign(JWT_SECRET);

  return { token, user };
}

export async function requireAuth() {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) throw new Error("Unauthorized");

  const { payload } = await jwtVerify(token, JWT_SECRET);
  const result = jwtPayloadSchema.safeParse(payload);
  if (!result.success) throw new Error("Unauthorized");
  return result.data;
}

export async function getOptionalAuth() {
  try {
    return await requireAuth();
  } catch {
    return null;
  }
}

export async function requireSuperAdmin() {
  const auth = await requireAuth();
  const user = await db.user.findUnique({ where: { id: auth.userId } });
  if (!user || user.role !== ROLE_SUPER_ADMIN) {
    throw new Error("Forbidden");
  }
  return { ...auth, role: user.role };
}

/**
 * Hash a raw token string with SHA-256.
 * Used for password reset tokens (store hash, not raw value).
 */
export function hashToken(raw: string): string {
  return createHash("sha256").update(raw).digest("hex");
}

/**
 * Verify a user's password by ID. Returns the user if valid, null otherwise.
 */
export async function verifyUserPassword(userId: string, password: string) {
  const user = await db.user.findUnique({ where: { id: userId } });
  if (!user) return null;
  const valid = await bcrypt.compare(password, user.password);
  return valid ? user : null;
}

export { COOKIE_NAME, TENANT_COOKIE, JWT_SECRET, ROLE_SUPER_ADMIN };
