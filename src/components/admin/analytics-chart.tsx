// Copyright (c) 2026 Jérémy Vtipil
// Licensed under the GNU Affero General Public License v3.0

"use client";

interface DataPoint {
  date: string;
  views: number;
  uniques: number;
}

interface AnalyticsChartProps {
  data: DataPoint[];
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
}

function formatNumber(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}

export function AnalyticsChart({ data }: AnalyticsChartProps) {
  if (data.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <p className="text-sm text-gray-400 text-center py-12">
          No data for this period yet
        </p>
      </div>
    );
  }

  const maxValue = Math.max(...data.map((d) => Math.max(d.views, d.uniques)), 1);

  // Chart dimensions
  const W = 800;
  const H = 280;
  const padL = 48;
  const padR = 16;
  const padT = 16;
  const padB = 40;
  const chartW = W - padL - padR;
  const chartH = H - padT - padB;

  // Scale functions
  const xScale = (i: number) =>
    padL + (data.length === 1 ? chartW / 2 : (i / (data.length - 1)) * chartW);
  const yScale = (v: number) => padT + chartH - (v / maxValue) * chartH;

  // Build SVG paths
  const viewsPath = data
    .map((d, i) => `${i === 0 ? "M" : "L"} ${xScale(i)} ${yScale(d.views)}`)
    .join(" ");
  const uniquesPath = data
    .map((d, i) => `${i === 0 ? "M" : "L"} ${xScale(i)} ${yScale(d.uniques)}`)
    .join(" ");

  // Area fill path for views
  const viewsArea = `${viewsPath} L ${xScale(data.length - 1)} ${padT + chartH} L ${xScale(0)} ${padT + chartH} Z`;

  // Y-axis ticks (4 lines)
  const yTicks = [0, 0.25, 0.5, 0.75, 1].map((pct) => ({
    y: padT + chartH - pct * chartH,
    label: formatNumber(Math.round(pct * maxValue)),
  }));

  // X-axis labels — show ~6 labels max
  const labelStep = Math.max(1, Math.floor(data.length / 6));

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-medium text-gray-900 uppercase tracking-wider">
          Traffic
        </h2>
        <div className="flex items-center gap-4 text-xs text-gray-500">
          <span className="flex items-center gap-1.5">
            <span className="inline-block w-3 h-0.5 bg-gray-900 rounded" />
            Views
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block w-3 h-0.5 bg-gray-400 rounded" style={{ backgroundImage: "repeating-linear-gradient(90deg, transparent, transparent 2px, #d1d5db 2px, #d1d5db 4px)" }} />
            Visitors
          </span>
        </div>
      </div>

      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" preserveAspectRatio="xMidYMid meet">
        {/* Grid lines */}
        {yTicks.map((tick, i) => (
          <g key={i}>
            <line
              x1={padL}
              y1={tick.y}
              x2={W - padR}
              y2={tick.y}
              stroke="#f3f4f6"
              strokeWidth={1}
            />
            <text
              x={padL - 8}
              y={tick.y + 4}
              textAnchor="end"
              className="fill-gray-400"
              fontSize={11}
            >
              {tick.label}
            </text>
          </g>
        ))}

        {/* Area fill */}
        <path d={viewsArea} fill="#f9fafb" />

        {/* Views line */}
        <path
          d={viewsPath}
          fill="none"
          stroke="#111827"
          strokeWidth={2}
          strokeLinejoin="round"
          strokeLinecap="round"
        />

        {/* Uniques line (dashed) */}
        <path
          d={uniquesPath}
          fill="none"
          stroke="#9ca3af"
          strokeWidth={1.5}
          strokeDasharray="6 3"
          strokeLinejoin="round"
          strokeLinecap="round"
        />

        {/* Data points for views */}
        {data.map((d, i) => (
          <circle
            key={`v-${i}`}
            cx={xScale(i)}
            cy={yScale(d.views)}
            r={data.length <= 14 ? 3 : 2}
            fill="#111827"
          />
        ))}

        {/* Data points for uniques */}
        {data.map((d, i) => (
          <circle
            key={`u-${i}`}
            cx={xScale(i)}
            cy={yScale(d.uniques)}
            r={data.length <= 14 ? 2.5 : 1.5}
            fill="#9ca3af"
          />
        ))}

        {/* X-axis labels */}
        {data.map((d, i) =>
          i % labelStep === 0 || i === data.length - 1 ? (
            <text
              key={`x-${i}`}
              x={xScale(i)}
              y={H - 8}
              textAnchor="middle"
              className="fill-gray-400"
              fontSize={11}
            >
              {formatDate(d.date)}
            </text>
          ) : null
        )}
      </svg>
    </div>
  );
}
