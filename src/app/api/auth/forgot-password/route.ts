// Copyright (c) 2026 Jérémy Vtipil
// Licensed under the GNU Affero General Public License v3.0

import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { db } from "@/lib/db";
import { parseBody } from "@/lib/api";
import { forgotPasswordSchema } from "@/lib/schemas";
import { checkRateLimit, RATE_LIMITS } from "@/lib/rate-limit";
import { sendEmail, passwordResetEmail } from "@/lib/email";
import { logger } from "@/lib/logger";
import { hashToken } from "@/lib/auth";
import { buildRootUrl, TOKEN_EXPIRY_MS } from "@/lib/constants";

export async function POST(req: Request) {
  const ip = req.headers.get("x-forwarded-for") || "unknown";
  const rl = checkRateLimit(
    `forgot:${ip}`,
    RATE_LIMITS.forgotPassword.maxAttempts,
    RATE_LIMITS.forgotPassword.windowMs,
  );
  if (rl.limited) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const body = await parseBody(req, forgotPasswordSchema);
  const { email } = body;

  // Always return 200 to not leak user existence
  const ok = NextResponse.json({ ok: true });

  const user = await db.user.findUnique({ where: { email } });
  if (!user) {
    logger.info("forgot_password_unknown_email", { email });
    return ok;
  }

  // Generate token
  const rawToken = randomUUID();
  const hashedToken = hashToken(rawToken);

  // Atomic: delete old tokens + create new one in a single transaction
  await db.$transaction([
    db.passwordResetToken.deleteMany({ where: { email } }),
    db.passwordResetToken.create({
      data: {
        token: hashedToken,
        email,
        expiresAt: new Date(Date.now() + TOKEN_EXPIRY_MS),
      },
    }),
  ]);

  const resetUrl = buildRootUrl(`/reset-password?token=${rawToken}`);

  try {
    const emailContent = passwordResetEmail(resetUrl);
    await sendEmail({ to: email, ...emailContent });
    logger.info("forgot_password_sent", { email });
  } catch (err) {
    logger.error("forgot_password_email_error", {
      email,
      error: err instanceof Error ? err.message : String(err),
    });
  }

  return ok;
}
