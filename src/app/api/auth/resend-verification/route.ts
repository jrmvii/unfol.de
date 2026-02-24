// Copyright (c) 2026 Jérémy Vtipil
// Licensed under the GNU Affero General Public License v3.0

import { NextResponse } from "next/server";
import { withAuth } from "@/lib/api";
import { db } from "@/lib/db";
import { checkRateLimit, RATE_LIMITS } from "@/lib/rate-limit";
import { sendVerificationEmail } from "@/lib/email-verification";
import { logger } from "@/lib/logger";

export const POST = withAuth(async (_req, { userId }) => {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { email: true, emailVerified: true },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  if (user.emailVerified) {
    return NextResponse.json({ error: "Email is already verified" }, { status: 400 });
  }

  const limit = checkRateLimit(
    `resend-verification:${userId}`,
    RATE_LIMITS.resendVerification.maxAttempts,
    RATE_LIMITS.resendVerification.windowMs
  );
  if (limit.limited) {
    return NextResponse.json(
      { error: "Too many attempts. Try again later." },
      { status: 429, headers: { "Retry-After": String(limit.retryAfter) } }
    );
  }

  // Fire-and-forget
  sendVerificationEmail(user.email);

  logger.info("verification_email_resent", { userId, email: user.email });

  return NextResponse.json({ ok: true });
});
