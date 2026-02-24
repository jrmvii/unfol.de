// Copyright (c) 2026 Jérémy Vtipil
// Licensed under the GNU Affero General Public License v3.0

import { NextResponse } from "next/server";
import { login, COOKIE_NAME } from "@/lib/auth";
import { loginSchema } from "@/lib/schemas";
import { checkRateLimit, RATE_LIMITS } from "@/lib/rate-limit";
import { logger } from "@/lib/logger";

export async function POST(req: Request) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";

  const limit = checkRateLimit(`login:${ip}`, RATE_LIMITS.login.maxAttempts, RATE_LIMITS.login.windowMs);
  if (limit.limited) {
    logger.warn("login_rate_limited", { ip });
    return NextResponse.json(
      { error: "Too many login attempts. Try again later." },
      { status: 429, headers: { "Retry-After": String(limit.retryAfter) } }
    );
  }

  const result = loginSchema.safeParse(await req.json());
  if (!result.success) {
    return NextResponse.json(
      { error: "Email and password required" },
      { status: 400 }
    );
  }

  const { email, password } = result.data;

  const loginResult = await login(email, password);
  if (!loginResult) {
    logger.warn("login_failed", { email, ip });
    return NextResponse.json(
      { error: "Invalid credentials" },
      { status: 401 }
    );
  }

  logger.info("login_success", { userId: loginResult.user.id, email, ip });

  const response = NextResponse.json({
    user: {
      id: loginResult.user.id,
      email: loginResult.user.email,
      name: loginResult.user.name,
      tenantId: loginResult.user.tenantId,
    },
  });

  response.cookies.set(COOKIE_NAME, loginResult.token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: "/",
  });

  return response;
}
