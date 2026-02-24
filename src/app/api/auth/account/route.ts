// Copyright (c) 2026 Jérémy Vtipil
// Licensed under the GNU Affero General Public License v3.0

import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { withAuth, parseBody } from "@/lib/api";
import { deleteAccountSchema } from "@/lib/schemas";
import { logger } from "@/lib/logger";
import { COOKIE_NAME, TENANT_COOKIE } from "@/lib/auth";

export const DELETE = withAuth(async (req, { userId, tenantId }) => {
  const { slug, password } = await parseBody(req, deleteAccountSchema);

  const user = await db.user.findUnique({
    where: { id: userId },
    include: { tenant: true },
  });
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  // Verify password
  const valid = await bcrypt.compare(password, user.password);
  if (!valid) {
    return NextResponse.json({ error: "Password is incorrect" }, { status: 400 });
  }

  // Verify slug matches (safety confirmation)
  if (user.tenant.slug !== slug) {
    return NextResponse.json({ error: "Slug does not match" }, { status: 400 });
  }

  // Log before destructive operation so we have a trace even if it crashes
  logger.info("account_deleting", { userId, tenantId, slug });

  // Delete tenant (cascades to user, projects, media, subscription, etc.)
  await db.tenant.delete({ where: { id: tenantId } });

  logger.info("account_deleted", { userId, tenantId, slug });

  const res = NextResponse.json({ ok: true });
  res.cookies.set(COOKIE_NAME, "", { maxAge: 0, path: "/" });
  res.cookies.set(TENANT_COOKIE, "", { maxAge: 0, path: "/" });
  return res;
});
