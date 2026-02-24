// Copyright (c) 2026 Jérémy Vtipil
// Licensed under the GNU Affero General Public License v3.0

import { db } from "./db";
import { periodToDate } from "./analytics";
import { logger } from "./logger";
import type { AnalyticsPeriod, PageType } from "./schemas";

export interface AnalyticsSummary {
  period: string;
  totalViews: number;
  totalUniques: number;
  referrers: { source: string; count: number }[];
  topPages: { path: string; views: number; uniques: number; pageType: string }[];
  timeSeries: { date: string; views: number; uniques: number }[];
}

/**
 * Fetch and aggregate analytics data for a tenant.
 * Uses pre-aggregated AnalyticsDaily data when available,
 * falls back to raw PageView in-memory aggregation.
 */
export async function getAnalyticsSummary(
  tenantId: string,
  period: AnalyticsPeriod,
  pageType?: PageType,
  resourceId?: string,
): Promise<AnalyticsSummary> {
  const sinceStr = periodToDate(period).toISOString().slice(0, 10);

  // Build where clause
  const where: Record<string, unknown> = { tenantId, date: { gte: sinceStr } };
  if (pageType) where.pageType = pageType;
  if (resourceId) where.resourceId = resourceId;

  // Try aggregated data first
  let dailyStats = await db.analyticsDaily.findMany({
    where,
    orderBy: { date: "asc" },
  });

  // Fallback: if no aggregated data, query raw PageView
  if (dailyStats.length === 0) {
    dailyStats = await aggregateFromRawViews(tenantId, period, pageType, resourceId);
  }

  // Compute totals
  const totalViews = dailyStats.reduce((sum, d) => sum + d.views, 0);
  const totalUniques = dailyStats.reduce((sum, d) => sum + d.uniqueVisitors, 0);

  return {
    period,
    totalViews,
    totalUniques,
    referrers: aggregateReferrers(dailyStats),
    topPages: aggregateTopPages(dailyStats),
    timeSeries: aggregateTimeSeries(dailyStats),
  };
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

type DailyStat = {
  id: string;
  tenantId: string;
  date: string;
  path: string;
  pageType: string;
  resourceId: string | null;
  views: number;
  uniqueVisitors: number;
  referrerJson: string;
};

async function aggregateFromRawViews(
  tenantId: string,
  period: AnalyticsPeriod,
  pageType?: string,
  resourceId?: string,
): Promise<DailyStat[]> {
  const since = periodToDate(period);
  const rawWhere: Record<string, unknown> = {
    tenantId,
    createdAt: { gte: since },
  };
  if (pageType) rawWhere.pageType = pageType;
  if (resourceId) rawWhere.resourceId = resourceId;

  const rawViews = await db.pageView.findMany({
    where: rawWhere,
    orderBy: { createdAt: "asc" },
  });

  const dayMap = new Map<
    string,
    {
      date: string;
      path: string;
      pageType: string;
      resourceId: string | null;
      views: number;
      visitors: Set<string>;
      referrers: Record<string, number>;
    }
  >();

  for (const v of rawViews) {
    const date = v.createdAt.toISOString().slice(0, 10);
    const key = `${date}|${v.path}`;
    const entry = dayMap.get(key) || {
      date,
      path: v.path,
      pageType: v.pageType,
      resourceId: v.resourceId,
      views: 0,
      visitors: new Set<string>(),
      referrers: {},
    };
    entry.views++;
    entry.visitors.add(v.visitorHash);
    const ref = v.referrer || "direct";
    entry.referrers[ref] = (entry.referrers[ref] || 0) + 1;
    dayMap.set(key, entry);
  }

  return Array.from(dayMap.values()).map((d) => ({
    id: "",
    tenantId,
    date: d.date,
    path: d.path,
    pageType: d.pageType,
    resourceId: d.resourceId,
    views: d.views,
    uniqueVisitors: d.visitors.size,
    referrerJson: JSON.stringify(d.referrers),
  }));
}

function aggregateReferrers(stats: DailyStat[]): { source: string; count: number }[] {
  const totals: Record<string, number> = {};
  for (const day of stats) {
    try {
      const refs = JSON.parse(day.referrerJson) as Record<string, number>;
      for (const [source, count] of Object.entries(refs)) {
        totals[source] = (totals[source] || 0) + count;
      }
    } catch (err) {
      logger.warn("referrer_json_parse_failed", { date: day.date, error: String(err) });
    }
  }
  return Object.entries(totals)
    .map(([source, count]) => ({ source, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 15);
}

function aggregateTopPages(stats: DailyStat[]): { path: string; views: number; uniques: number; pageType: string }[] {
  const pageMap = new Map<string, { views: number; uniques: number; pageType: string }>();
  for (const day of stats) {
    const existing = pageMap.get(day.path) || { views: 0, uniques: 0, pageType: day.pageType };
    existing.views += day.views;
    existing.uniques += day.uniqueVisitors;
    pageMap.set(day.path, existing);
  }
  return Array.from(pageMap.entries())
    .map(([path, data]) => ({ path, ...data }))
    .sort((a, b) => b.views - a.views)
    .slice(0, 20);
}

function aggregateTimeSeries(stats: DailyStat[]): { date: string; views: number; uniques: number }[] {
  const tsMap = new Map<string, { views: number; uniques: number }>();
  for (const d of stats) {
    const entry = tsMap.get(d.date) || { views: 0, uniques: 0 };
    entry.views += d.views;
    entry.uniques += d.uniqueVisitors;
    tsMap.set(d.date, entry);
  }
  return Array.from(tsMap.entries())
    .map(([date, data]) => ({ date, ...data }))
    .sort((a, b) => a.date.localeCompare(b.date));
}
