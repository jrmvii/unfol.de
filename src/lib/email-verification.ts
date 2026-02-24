// Copyright (c) 2026 Jérémy Vtipil
// Licensed under the GNU Affero General Public License v3.0

import { createHash, randomUUID } from "crypto";
import { db } from "./db";
import { sendEmail, emailVerificationEmail } from "./email";
import { buildRootUrl } from "./constants";
import { logger } from "./logger";

const VERIFICATION_EXPIRY_MS = 24 * 60 * 60 * 1000; // 24 hours

function hashToken(raw: string): string {
  return createHash("sha256").update(raw).digest("hex");
}

/**
 * Create a verification token and send the verification email.
 * Fire-and-forget — never throws to the caller.
 */
export async function sendVerificationEmail(email: string): Promise<void> {
  try {
    // Delete any previous tokens for this email
    await db.emailVerificationToken.deleteMany({ where: { email } });

    const rawToken = randomUUID();
    const hashedToken = hashToken(rawToken);

    await db.emailVerificationToken.create({
      data: {
        token: hashedToken,
        email,
        expiresAt: new Date(Date.now() + VERIFICATION_EXPIRY_MS),
      },
    });

    const verifyUrl = buildRootUrl(`/verify-email?token=${rawToken}`);
    await sendEmail({ to: email, ...emailVerificationEmail(verifyUrl) });
    logger.info("verification_email_sent", { email });
  } catch (err) {
    logger.error("verification_email_failed", {
      email,
      error: err instanceof Error ? err.message : String(err),
    });
  }
}

/**
 * Verify a token: mark email as verified, consume the token.
 * Returns the email on success, or an error message string on failure.
 */
export async function verifyEmailToken(rawToken: string): Promise<{ ok: true; email: string } | { ok: false; error: string }> {
  const hashedToken = hashToken(rawToken);

  const record = await db.emailVerificationToken.findUnique({
    where: { token: hashedToken },
  });

  if (!record) {
    return { ok: false, error: "Invalid verification link." };
  }

  if (record.usedAt) {
    return { ok: false, error: "This link has already been used." };
  }

  if (record.expiresAt < new Date()) {
    return { ok: false, error: "This link has expired. Please request a new one." };
  }

  // Mark token as used + mark user as verified
  await db.$transaction([
    db.emailVerificationToken.update({
      where: { id: record.id },
      data: { usedAt: new Date() },
    }),
    db.user.updateMany({
      where: { email: record.email },
      data: { emailVerified: true },
    }),
  ]);

  return { ok: true, email: record.email };
}

export class EmailNotVerifiedError extends Error {
  constructor(message = "Please verify your email before performing this action") {
    super(message);
    this.name = "EmailNotVerifiedError";
  }
}

/**
 * Throws EmailNotVerifiedError if the user's email is not verified.
 */
export async function requireEmailVerified(userId: string): Promise<void> {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { emailVerified: true },
  });
  if (!user?.emailVerified) {
    throw new EmailNotVerifiedError();
  }
}
