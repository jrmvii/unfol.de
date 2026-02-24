// Copyright (c) 2026 Jérémy Vtipil
// Licensed under the GNU Affero General Public License v3.0

import { NextResponse } from "next/server";
import { withAuth } from "@/lib/api";
import { analyticsQuerySchema } from "@/lib/schemas";
import { getAnalyticsSummary } from "@/lib/analytics-query";

export const GET = withAuth(async (req, { tenantId }) => {
  const url = new URL(req.url);
  const params = analyticsQuerySchema.safeParse({
    period: url.searchParams.get("period") || "30d",
    pageType: url.searchParams.get("pageType") || undefined,
    resourceId: url.searchParams.get("resourceId") || undefined,
  });

  if (!params.success) {
    return NextResponse.json({ error: "Invalid parameters" }, { status: 400 });
  }

  const { period, pageType, resourceId } = params.data;
  const summary = await getAnalyticsSummary(tenantId, period, pageType, resourceId);
  return NextResponse.json(summary);
});
