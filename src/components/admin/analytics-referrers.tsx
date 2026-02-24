// Copyright (c) 2026 Jérémy Vtipil
// Licensed under the GNU Affero General Public License v3.0

"use client";

interface Referrer {
  source: string;
  count: number;
}

interface AnalyticsReferrersProps {
  referrers: Referrer[];
}

export function AnalyticsReferrers({ referrers }: AnalyticsReferrersProps) {
  if (referrers.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-sm font-medium text-gray-900 uppercase tracking-wider mb-4">
          Sources
        </h2>
        <p className="text-sm text-gray-400 text-center py-6">No referrer data yet</p>
      </div>
    );
  }

  const maxCount = referrers[0]?.count || 1;
  const total = referrers.reduce((sum, r) => sum + r.count, 0);

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h2 className="text-sm font-medium text-gray-900 uppercase tracking-wider mb-4">
        Sources
      </h2>
      <div className="space-y-2.5">
        {referrers.map(({ source, count }) => {
          const pct = total > 0 ? Math.round((count / total) * 100) : 0;
          return (
            <div key={source} className="group">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-gray-700 truncate max-w-[60%]">
                  {source}
                </span>
                <span className="text-xs text-gray-400 tabular-nums">
                  {count} <span className="text-gray-300">({pct}%)</span>
                </span>
              </div>
              <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gray-900 rounded-full transition-all duration-500"
                  style={{ width: `${(count / maxCount) * 100}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
