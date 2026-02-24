// Copyright (c) 2026 Jérémy Vtipil
// Licensed under the GNU Affero General Public License v3.0

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getTenantSlug, getTenant } from "@/lib/tenant";
import { withAuth, parseBody, ValidationError } from "@/lib/api";
import { tenantUpdateSchema } from "@/lib/schemas";
import { ROOT_DOMAINS } from "@/lib/constants";
import { getPlanLimits } from "@/lib/billing";
import { requireEmailVerified } from "@/lib/email-verification";

export async function GET() {
  const slug = await getTenantSlug();
  if (!slug) {
    return NextResponse.json({ error: "No tenant" }, { status: 400 });
  }

  const tenant = await getTenant();
  if (!tenant) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(tenant);
}

export const PUT = withAuth(async (req, { tenantId, userId }) => {
  const data = await parseBody(req, tenantUpdateSchema);

  // Validate aboutPageId belongs to this tenant
  if (data.aboutPageId && data.aboutPageId !== "") {
    const page = await db.page.findFirst({
      where: { id: data.aboutPageId, tenantId },
    });
    if (!page) {
      throw new ValidationError("About page not found or does not belong to this tenant");
    }
  }

  // Validate homePageId belongs to this tenant
  if (data.homePageId && data.homePageId !== "") {
    const page = await db.page.findFirst({
      where: { id: data.homePageId, tenantId },
    });
    if (!page) {
      throw new ValidationError("Home page not found or does not belong to this tenant");
    }
  }

  // Validate custom domain doesn't conflict with platform domains
  if (data.domain && data.domain !== "") {
    await requireEmailVerified(userId);
    const limits = await getPlanLimits(tenantId);
    if (!limits.customDomain) {
      throw new ValidationError("Custom domains require a Pro plan. Please upgrade.");
    }

    const isDomainConflict = ROOT_DOMAINS.some(
      rd => data.domain === rd || data.domain!.endsWith(`.${rd}`)
    );
    if (isDomainConflict) {
      throw new ValidationError("This domain conflicts with a platform domain");
    }
  }

  // Convert "" → null for DB-nullable fields, drop "" for non-nullable
  const NULLABLE = new Set([
    "bio", "email", "aboutPageId", "homePageId", "logoUrl",
    "faviconUrl", "domain", "instagramUrl", "behanceUrl", "linkedinUrl", "websiteUrl",
  ]);
  const cleaned = Object.fromEntries(
    Object.entries(data)
      .filter(([k, v]) => v !== "" || NULLABLE.has(k))
      .map(([k, v]) => [k, v === "" ? null : v])
  );

  const tenant = await db.tenant.update({
    where: { id: tenantId },
    data: cleaned,
  });

  return NextResponse.json(tenant);
});
