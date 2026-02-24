// Copyright (c) 2026 Jérémy Vtipil
// Licensed under the GNU Affero General Public License v3.0

import { db } from "@/lib/db";

interface RawGroup {
  tenantId: string;
  date: string;
  path: string;
  pageType: string;
  resourceId: string | null;
  views: bigint;
  uniqueVisitors: bigint;
}

interface RawReferrer {
  tenantId: string;
  date: string;
  path: string;
  referrer: string | null;
  count: bigint;
}

/**
 * Aggregate raw PageView records into AnalyticsDaily rows.
 * Processes events older than 24 hours, then deletes the raw records.
 */
export async function aggregatePageViews() {
  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);

  // Group page views by tenant/date/path
  const groups = await db.$queryRaw<RawGroup[]>`
    SELECT
      "tenantId",
      TO_CHAR("createdAt", 'YYYY-MM-DD') as date,
      path,
      "pageType",
      "resourceId",
      COUNT(*) as views,
      COUNT(DISTINCT "visitorHash") as "uniqueVisitors"
    FROM "PageView"
    WHERE "createdAt" < ${cutoff}
    GROUP BY "tenantId", TO_CHAR("createdAt", 'YYYY-MM-DD'), path, "pageType", "resourceId"
  `;

  // Get referrer breakdown per group
  const referrers = await db.$queryRaw<RawReferrer[]>`
    SELECT
      "tenantId",
      TO_CHAR("createdAt", 'YYYY-MM-DD') as date,
      path,
      referrer,
      COUNT(*) as count
    FROM "PageView"
    WHERE "createdAt" < ${cutoff}
    GROUP BY "tenantId", TO_CHAR("createdAt", 'YYYY-MM-DD'), path, referrer
  `;

  // Build referrer maps keyed by "tenantId|date|path"
  const referrerMap = new Map<string, Record<string, number>>();
  for (const r of referrers) {
    const key = `${r.tenantId}|${r.date}|${r.path}`;
    const map = referrerMap.get(key) || {};
    map[r.referrer || "direct"] = Number(r.count);
    referrerMap.set(key, map);
  }

  // Upsert into AnalyticsDaily
  let upserted = 0;
  for (const g of groups) {
    const key = `${g.tenantId}|${g.date}|${g.path}`;
    const refs = referrerMap.get(key) || {};

    await db.$executeRaw`
      INSERT INTO "AnalyticsDaily" (id, "tenantId", "date", path, "pageType", "resourceId", views, "uniqueVisitors", "referrerJson")
      VALUES (
        ${crypto.randomUUID()},
        ${g.tenantId},
        ${g.date},
        ${g.path},
        ${g.pageType},
        ${g.resourceId},
        ${Number(g.views)},
        ${Number(g.uniqueVisitors)},
        ${JSON.stringify(refs)}
      )
      ON CONFLICT("tenantId", "date", path) DO UPDATE SET
        views = "AnalyticsDaily".views + ${Number(g.views)},
        "uniqueVisitors" = ${Number(g.uniqueVisitors)},
        "referrerJson" = ${JSON.stringify(refs)}
    `;
    upserted++;
  }

  // Delete aggregated raw records
  const deleted = await db.pageView.deleteMany({
    where: { createdAt: { lt: cutoff } },
  });

  return { upserted, deleted: deleted.count };
}
