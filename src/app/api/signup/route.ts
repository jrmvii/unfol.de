// Copyright (c) 2026 Jérémy Vtipil
// Licensed under the GNU Affero General Public License v3.0

import { NextResponse } from "next/server";
import { signupSchema } from "@/lib/schemas";
import { validateSlugAvailability } from "@/lib/slug-validation";
import { checkRateLimit, RATE_LIMITS } from "@/lib/rate-limit";
import { logger } from "@/lib/logger";
import { createTenantWithUser, SignupError } from "@/lib/signup-service";
import { SignJWT } from "jose";
import { JWT_SECRET, COOKIE_NAME } from "@/lib/auth";
import { ROOT_DOMAINS, buildAdminUrl, AUTH_COOKIE_MAX_AGE } from "@/lib/constants";
import { sendVerificationEmail } from "@/lib/email-verification";

export async function POST(req: Request) {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";

  const limit = checkRateLimit(`signup:${ip}`, RATE_LIMITS.signup.maxAttempts, RATE_LIMITS.signup.windowMs);
  if (limit.limited) {
    logger.warn("signup_rate_limited", { ip });
    return NextResponse.json(
      { error: "Too many signup attempts. Try again later." },
      { status: 429, headers: { "Retry-After": String(limit.retryAfter) } }
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const result = signupSchema.safeParse(body);
  if (!result.success) {
    const messages = result.error.issues.map(
      (i) => `${i.path.join(".")}: ${i.message}`
    );
    return NextResponse.json({ error: messages.join("; ") }, { status: 400 });
  }

  const { slug, name, email, password } = result.data;

  // Check slug availability (reserved + existing)
  const slugCheck = await validateSlugAvailability(slug);
  if (!slugCheck.available) {
    return NextResponse.json({ error: slugCheck.reason }, { status: 409 });
  }

  let tenant, user;
  try {
    ({ tenant, user } = await createTenantWithUser({ slug, name, email, password }));
  } catch (err) {
    if (err instanceof SignupError) {
      return NextResponse.json({ error: err.message }, { status: err.statusCode });
    }
    throw err;
  }

  const token = await new SignJWT({
    userId: user.id,
    tenantId: tenant.id,
    role: "ADMIN",
  })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("7d")
    .sign(JWT_SECRET);

  logger.info("signup_success", { slug, email, ip });

  // Determine redirect URL
  const redirectUrl = buildAdminUrl(slug);

  // Fire-and-forget verification email (includes welcome content)
  sendVerificationEmail(email);

  const response = NextResponse.json(
    { tenant: { slug: tenant.slug, name: tenant.name }, redirectUrl },
    { status: 201 }
  );

  // Set JWT cookie on parent domain for cross-subdomain auth
  const rootDomain = ROOT_DOMAINS[0];
  const cookieDomain = rootDomain ? `.${rootDomain}` : undefined;
  response.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: AUTH_COOKIE_MAX_AGE,
    path: "/",
    ...(cookieDomain ? { domain: cookieDomain } : {}),
  });

  return response;
}
