// Copyright (c) 2026 Jérémy Vtipil
// Licensed under the GNU Affero General Public License v3.0

import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { trackEventSchema } from "@/lib/schemas";
import { visitorHash, cleanReferrer, isBot, forwardToUmami } from "@/lib/analytics";
import { logger } from "@/lib/logger";

export async function POST(req: Request) {
  const headersList = await headers();
  const tenantSlug = headersList.get("x-tenant-slug");
  if (!tenantSlug) return new NextResponse(null, { status: 204 });

  const ua = headersList.get("user-agent") || "";
  if (isBot(ua)) return new NextResponse(null, { status: 204 });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return new NextResponse(null, { status: 204 });
  }

  const result = trackEventSchema.safeParse(body);
  if (!result.success) return new NextResponse(null, { status: 204 });

  const { path, pageType, resourceId, referrer } = result.data;

  const tenant = await db.tenant.findFirst({
    where: { OR: [{ slug: tenantSlug }, { domain: tenantSlug }] },
    select: { id: true },
  });
  if (!tenant) return new NextResponse(null, { status: 204 });

  const forwarded = headersList.get("x-forwarded-for");
  const ip = forwarded?.split(",")[0]?.trim() || "unknown";
  const hash = visitorHash(ip, ua);
  const cleanedReferrer = cleanReferrer(referrer);

  // Fire-and-forget write
  db.pageView
    .create({
      data: {
        tenantId: tenant.id,
        path,
        pageType,
        resourceId: resourceId || null,
        visitorHash: hash,
        referrer: cleanedReferrer,
      },
    })
    .catch((err) => logger.warn("analytics_write_failed", {
      tenantId: tenant.id,
      path,
      error: err instanceof Error ? err.message : String(err),
      code: err instanceof Error && "code" in err ? (err as { code: string }).code : undefined,
    }));

  // Optional Umami forwarding
  forwardToUmami(path, referrer, ua, tenantSlug);

  return new NextResponse(null, { status: 204 });
}
