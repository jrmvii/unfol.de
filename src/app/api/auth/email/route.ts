// Copyright (c) 2026 Jérémy Vtipil
// Licensed under the GNU Affero General Public License v3.0

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { withAuth, parseBody } from "@/lib/api";
import { changeEmailSchema } from "@/lib/schemas";
import { logger } from "@/lib/logger";
import { sendVerificationEmail } from "@/lib/email-verification";
import { verifyUserPassword } from "@/lib/auth";

export const PUT = withAuth(async (req, { userId }) => {
  const { newEmail, password } = await parseBody(req, changeEmailSchema);

  const user = await verifyUserPassword(userId, password);
  if (!user) {
    return NextResponse.json({ error: "Password is incorrect" }, { status: 400 });
  }

  // Check uniqueness
  const existing = await db.user.findUnique({ where: { email: newEmail } });
  if (existing && existing.id !== userId) {
    return NextResponse.json({ error: "This email is already in use" }, { status: 409 });
  }

  await db.user.update({
    where: { id: userId },
    data: { email: newEmail, emailVerified: false },
  });

  // Send verification email to the new address (fire-and-forget)
  sendVerificationEmail(newEmail);

  logger.info("email_changed", { userId, newEmail });

  return NextResponse.json({ ok: true });
});
