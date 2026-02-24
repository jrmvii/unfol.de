// Copyright (c) 2026 Jérémy Vtipil
// Licensed under the GNU Affero General Public License v3.0

import { NextResponse } from "next/server";
import { aggregatePageViews } from "@/lib/analytics-aggregator";

export async function POST(req: Request) {
  const authHeader = req.headers.get("authorization");
  const secret = process.env.ANALYTICS_CRON_SECRET;

  if (!secret || authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await aggregatePageViews();
  return NextResponse.json(result);
}
