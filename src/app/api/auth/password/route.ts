// Copyright (c) 2026 Jérémy Vtipil
// Licensed under the GNU Affero General Public License v3.0

import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { withAuth, parseBody } from "@/lib/api";
import { changePasswordSchema } from "@/lib/schemas";
import { logger } from "@/lib/logger";
import { verifyUserPassword } from "@/lib/auth";

export const PUT = withAuth(async (req, { userId }) => {
  const { currentPassword, newPassword } = await parseBody(req, changePasswordSchema);

  const user = await verifyUserPassword(userId, currentPassword);
  if (!user) {
    return NextResponse.json({ error: "Current password is incorrect" }, { status: 400 });
  }

  const hashed = await bcrypt.hash(newPassword, 12);
  await db.user.update({ where: { id: userId }, data: { password: hashed } });

  logger.info("password_changed", { userId });

  return NextResponse.json({ ok: true });
});
