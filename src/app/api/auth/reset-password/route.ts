// Copyright (c) 2026 Jérémy Vtipil
// Licensed under the GNU Affero General Public License v3.0

import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { parseBody } from "@/lib/api";
import { resetPasswordSchema } from "@/lib/schemas";
import { logger } from "@/lib/logger";
import { hashToken } from "@/lib/auth";

export async function POST(req: Request) {
  const body = await parseBody(req, resetPasswordSchema);
  const { token: rawToken, password } = body;

  const hashedToken = hashToken(rawToken);

  const resetToken = await db.passwordResetToken.findUnique({
    where: { token: hashedToken },
  });

  if (!resetToken) {
    return NextResponse.json({ error: "Invalid or expired reset link" }, { status: 400 });
  }

  if (resetToken.usedAt) {
    return NextResponse.json({ error: "This reset link has already been used" }, { status: 400 });
  }

  if (new Date() > resetToken.expiresAt) {
    return NextResponse.json({ error: "This reset link has expired" }, { status: 400 });
  }

  const user = await db.user.findUnique({ where: { email: resetToken.email } });
  if (!user) {
    return NextResponse.json({ error: "Account not found" }, { status: 400 });
  }

  const hashedPassword = await bcrypt.hash(password, 12);

  await db.$transaction([
    db.user.update({
      where: { id: user.id },
      data: { password: hashedPassword },
    }),
    db.passwordResetToken.update({
      where: { id: resetToken.id },
      data: { usedAt: new Date() },
    }),
  ]);

  logger.info("password_reset_completed", { email: resetToken.email });

  return NextResponse.json({ ok: true });
}
