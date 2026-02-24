// Copyright (c) 2026 Jérémy Vtipil
// Licensed under the GNU Affero General Public License v3.0

"use client";

import { AnalyticsChart } from "./analytics-chart";
import { AnalyticsReferrers } from "./analytics-referrers";
import { useAnalyticsFetch, formatNumber, PERIODS } from "@/lib/use-analytics";

interface Referrer {
  source: string;
  count: number;
}

interface TopPage {
  path: string;
  views: number;
  uniques: number;
  pageType: string;
}

interface TimeSeriesPoint {
  date: string;
  views: number;
  uniques: number;
}

interface AnalyticsData {
  totalViews: number;
  totalUniques: number;
  referrers: Referrer[];
  topPages: TopPage[];
  timeSeries: TimeSeriesPoint[];
}

function pageTypeLabel(type: string): string {
  return type.charAt(0).toUpperCase() + type.slice(1);
}

export function AnalyticsDashboard() {
  const { period, setPeriod, data, loading } = useAnalyticsFetch<AnalyticsData>("/api/analytics");

  const topReferrer = data?.referrers?.[0]?.source || "—";
  const isEmpty = !data || (data.totalViews === 0 && data.timeSeries.length === 0);

  return (
    <div className="space-y-6">
      {/* Period selector */}
      <div className="flex items-center gap-1 bg-white rounded-lg shadow-sm p-1 w-fit">
        {PERIODS.map((p) => (
          <button
            key={p.value}
            onClick={() => setPeriod(p.value)}
            className={`px-3 py-1.5 rounded text-sm transition-colors ${
              period === p.value
                ? "bg-gray-900 text-white font-medium"
                : "text-gray-500 hover:text-gray-900"
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-sm text-gray-400 py-12 text-center">Loading…</div>
      ) : isEmpty ? (
        <div className="bg-white rounded-lg shadow-sm p-6 text-center py-16">
          <p className="text-sm text-gray-400">No analytics data yet.</p>
          <p className="text-xs text-gray-300 mt-1">
            Visitor data will appear here once your portfolio receives traffic.
          </p>
        </div>
      ) : (
        <>
          {/* Stat cards */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <p className="text-3xl font-bold text-gray-900 tabular-nums">
                {formatNumber(data!.totalViews)}
              </p>
              <p className="text-sm text-gray-500 mt-1">Page views</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <p className="text-3xl font-bold text-gray-900 tabular-nums">
                {formatNumber(data!.totalUniques)}
              </p>
              <p className="text-sm text-gray-500 mt-1">Unique visitors</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <p className="text-3xl font-bold text-gray-900 truncate">
                {topReferrer}
              </p>
              <p className="text-sm text-gray-500 mt-1">Top source</p>
            </div>
          </div>

          {/* Time series chart */}
          <AnalyticsChart data={data!.timeSeries} />

          {/* Bottom grid: pages + referrers */}
          <div className="grid grid-cols-2 gap-4">
            {/* Top pages */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-sm font-medium text-gray-900 uppercase tracking-wider mb-4">
                Top pages
              </h2>
              {data!.topPages.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-6">No data</p>
              ) : (
                <div className="space-y-0">
                  <div className="flex items-center text-xs text-gray-400 pb-2 border-b border-gray-100">
                    <span className="flex-1">Path</span>
                    <span className="w-16 text-right">Views</span>
                    <span className="w-16 text-right">Visitors</span>
                  </div>
                  {data!.topPages.map((page) => (
                    <div
                      key={page.path}
                      className="flex items-center py-2 border-b border-gray-50 last:border-0"
                    >
                      <div className="flex-1 min-w-0">
                        <span className="text-sm text-gray-700 truncate block">
                          {page.path}
                        </span>
                        <span className="text-[10px] text-gray-400 uppercase tracking-wider">
                          {pageTypeLabel(page.pageType)}
                        </span>
                      </div>
                      <span className="w-16 text-right text-sm text-gray-900 tabular-nums">
                        {page.views}
                      </span>
                      <span className="w-16 text-right text-sm text-gray-400 tabular-nums">
                        {page.uniques}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Referrer breakdown */}
            <AnalyticsReferrers referrers={data!.referrers} />
          </div>
        </>
      )}
    </div>
  );
}
