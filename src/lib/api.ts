// Copyright (c) 2026 Jérémy Vtipil
// Licensed under the GNU Affero General Public License v3.0

import { NextResponse } from "next/server";
import { headers } from "next/headers";
import * as Sentry from "@sentry/nextjs";
import { requireAuth, requireSuperAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { Prisma } from "@prisma/client";
import { logger } from "@/lib/logger";
import { PlanLimitError } from "@/lib/billing";
import { EmailNotVerifiedError } from "@/lib/email-verification";
import type { z } from "zod/v4";

type AuthContext = { userId: string; tenantId: string; role?: string };

type AuthHandler = (
  req: Request,
  ctx: AuthContext
) => Promise<NextResponse>;

async function getRequestId(): Promise<string> {
  try {
    const h = await headers();
    return h.get("x-request-id") || crypto.randomUUID().slice(0, 8);
  } catch {
    return crypto.randomUUID().slice(0, 8);
  }
}

function handleApiError(error: unknown, req: Request, reqId: string): NextResponse {
  if (error instanceof ValidationError) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
  if (error instanceof PlanLimitError) {
    return NextResponse.json(
      { error: error.message, upgrade: true, resource: error.resource },
      { status: 403 }
    );
  }
  if (error instanceof EmailNotVerifiedError) {
    return NextResponse.json(
      { error: error.message, verifyEmail: true },
      { status: 403 }
    );
  }
  if (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002"
  ) {
    return NextResponse.json(
      { error: "A record with that value already exists" },
      { status: 409 }
    );
  }
  logger.error("api_error", {
    reqId,
    method: req.method,
    url: req.url,
    error: error instanceof Error ? error.message : String(error),
    stack: error instanceof Error ? error.stack : undefined,
  });
  Sentry.captureException(error, {
    extra: { reqId, method: req.method, url: req.url },
  });
  return NextResponse.json({ error: "Internal server error", requestId: reqId }, { status: 500 });
}

function resolveAuth(): Promise<AuthContext> {
  return requireAuth();
}

/**
 * Wraps an API route handler with auth + structured error handling.
 */
export function withAuth(handler: AuthHandler) {
  return async (req: Request) => {
    const reqId = await getRequestId();
    let auth: AuthContext;
    try {
      auth = await resolveAuth();
    } catch {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    Sentry.setUser({ id: auth.userId });
    Sentry.setTag("tenant", auth.tenantId);
    try {
      return await handler(req, auth);
    } catch (error) {
      return handleApiError(error, req, reqId);
    }
  };
}

/**
 * Same as withAuth but also extracts route params (for [id] routes).
 */
type AuthParamsHandler<P> = (
  req: Request,
  ctx: AuthContext,
  params: P
) => Promise<NextResponse>;

export function withAuthParams<P>(handler: AuthParamsHandler<P>) {
  return async (req: Request, { params }: { params: Promise<P> }) => {
    const reqId = await getRequestId();
    let auth: AuthContext;
    try {
      auth = await resolveAuth();
    } catch {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    Sentry.setUser({ id: auth.userId });
    Sentry.setTag("tenant", auth.tenantId);
    const resolvedParams = await params;
    try {
      return await handler(req, auth, resolvedParams);
    } catch (error) {
      return handleApiError(error, req, reqId);
    }
  };
}

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ValidationError";
  }
}

/**
 * Parse and validate a JSON request body against a Zod schema.
 * Throws ValidationError with a readable message on failure.
 */
export async function parseBody<T extends z.ZodType>(
  req: Request,
  schema: T
): Promise<z.infer<T>> {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    throw new ValidationError("Invalid JSON body");
  }
  const result = schema.safeParse(body);
  if (!result.success) {
    const messages = result.error.issues.map(
      (i) => `${i.path.join(".")}: ${i.message}`
    );
    throw new ValidationError(messages.join("; "));
  }
  return result.data;
}

type SuperAdminHandler = (req: Request, ctx: AuthContext) => Promise<NextResponse>;

/**
 * Wraps an API route handler with super admin auth + structured error handling.
 */
export function withSuperAdmin(handler: SuperAdminHandler) {
  return async (req: Request) => {
    const reqId = await getRequestId();
    let auth: AuthContext;
    try {
      auth = await requireSuperAdmin();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unauthorized";
      const status = message === "Forbidden" ? 403 : 401;
      return NextResponse.json({ error: message }, { status });
    }
    Sentry.setUser({ id: auth.userId });
    Sentry.setTag("tenant", auth.tenantId);
    try {
      return await handler(req, auth);
    } catch (error) {
      return handleApiError(error, req, reqId);
    }
  };
}

/**
 * Same as withSuperAdmin but also extracts route params (for [id] routes).
 */
export function withSuperAdminParams<P>(
  handler: (req: Request, ctx: AuthContext, params: P) => Promise<NextResponse>
) {
  return async (req: Request, { params }: { params: Promise<P> }) => {
    const reqId = await getRequestId();
    let auth: AuthContext;
    try {
      auth = await requireSuperAdmin();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unauthorized";
      const status = message === "Forbidden" ? 403 : 401;
      return NextResponse.json({ error: message }, { status });
    }
    Sentry.setUser({ id: auth.userId });
    Sentry.setTag("tenant", auth.tenantId);
    const resolvedParams = await params;
    try {
      return await handler(req, auth, resolvedParams);
    } catch (error) {
      return handleApiError(error, req, reqId);
    }
  };
}

/**
 * Returns the next sortOrder value for a given model/filter.
 * Usage: const order = await nextSortOrder("category", { tenantId });
 */
export async function nextSortOrder(
  model: "category" | "project" | "page" | "media",
  where: Record<string, unknown>
): Promise<number> {
  const result = await (db[model] as { aggregate: CallableFunction }).aggregate({
    where,
    _max: { sortOrder: true },
  });
  return ((result as { _max: { sortOrder: number | null } })._max.sortOrder ?? -1) + 1;
}
