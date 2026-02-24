// Copyright (c) 2026 Jérémy Vtipil
// Licensed under the GNU Affero General Public License v3.0

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";
import { JWT_SECRET, COOKIE_NAME } from "@/lib/auth";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const requestId = crypto.randomUUID().slice(0, 8);

  const slug =
    process.env.TENANT_SLUG ||
    req.cookies.get("unfolde-tenant")?.value ||
    "default";

  // Gate admin routes: verify JWT token
  if (pathname.startsWith("/admin") && pathname !== "/admin/login") {
    const token = req.cookies.get(COOKIE_NAME)?.value;
    if (!token) {
      return NextResponse.redirect(new URL("/admin/login", req.url));
    }

    try {
      await jwtVerify(token, JWT_SECRET);
    } catch {
      const response = NextResponse.redirect(new URL("/admin/login", req.url));
      response.cookies.delete(COOKIE_NAME);
      return response;
    }
  }

  // Forward tenant slug and request ID as request headers for server components
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("x-tenant-slug", slug);
  requestHeaders.set("x-request-id", requestId);

  const response = NextResponse.next({
    request: { headers: requestHeaders },
  });
  response.headers.set("x-tenant-slug", slug);
  response.headers.set("x-request-id", requestId);

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|api/uploads/|monitoring|.*\\.(?:svg|png|jpg|jpeg|gif|webp|woff2|mp4|ico)$).*)",
  ],
};
