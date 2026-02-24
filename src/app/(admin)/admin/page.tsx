// Copyright (c) 2026 Jérémy Vtipil
// Licensed under the GNU Affero General Public License v3.0

import { requireAuth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getBillingStatus } from "@/lib/billing";
import Link from "next/link";

function UsageBar({ label, current, max }: { label: string; current: number; max: number }) {
  const unlimited = max === -1;
  const pct = unlimited ? 0 : Math.min((current / max) * 100, 100);
  const atLimit = !unlimited && current >= max;
  const nearLimit = !unlimited && pct >= 80;

  return (
    <div>
      <div className="flex justify-between text-xs text-gray-500 mb-1">
        <span>{label}</span>
        <span>
          {current} / {unlimited ? "∞" : max}
        </span>
      </div>
      {!unlimited && (
        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${
              atLimit ? "bg-red-500" : nearLimit ? "bg-amber-500" : "bg-gray-900"
            }`}
            style={{ width: `${pct}%` }}
          />
        </div>
      )}
    </div>
  );
}

export default async function AdminDashboard() {
  const { tenantId } = await requireAuth();

  const [categoryCount, mediaCount, billing] = await Promise.all([
    db.category.count({ where: { tenantId } }),
    db.media.count({ where: { project: { tenantId } } }),
    getBillingStatus(tenantId),
  ]);

  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-900 mb-8">Dashboard</h1>

      {/* Plan + Usage */}
      <div className="bg-white p-6 rounded-lg shadow-sm mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <span className="text-xs uppercase tracking-widest text-gray-400">Plan</span>
            <p className="text-lg font-semibold text-gray-900">{billing.planLabel}</p>
          </div>
          <Link
            href="/admin/billing"
            className="text-xs uppercase tracking-widest px-4 py-2 border border-gray-900 text-gray-900 hover:bg-gray-900 hover:text-white transition-colors"
          >
            {billing.plan === "free" ? "Upgrade" : "Manage"}
          </Link>
        </div>
        <div className="space-y-3">
          <UsageBar label="Projects" current={billing.usage.projects} max={billing.limits.maxProjects} />
          <UsageBar label="Pages" current={billing.usage.pages} max={billing.limits.maxPages} />
          <UsageBar
            label="Storage"
            current={Math.round(billing.usage.storageMb)}
            max={billing.limits.maxStorageMb}
          />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <p className="text-3xl font-bold text-gray-900">{categoryCount}</p>
          <p className="text-sm text-gray-500 mt-1">Categories</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <p className="text-3xl font-bold text-gray-900">{billing.usage.projects}</p>
          <p className="text-sm text-gray-500 mt-1">Projects</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <p className="text-3xl font-bold text-gray-900">{mediaCount}</p>
          <p className="text-sm text-gray-500 mt-1">Media files</p>
        </div>
      </div>

      {/* Quick links */}
      <div className="space-y-2">
        <Link
          href="/admin/categories"
          className="block bg-white p-4 rounded-lg shadow-sm hover:shadow text-sm text-gray-700"
        >
          Manage categories
        </Link>
        <Link
          href="/admin/projects"
          className="block bg-white p-4 rounded-lg shadow-sm hover:shadow text-sm text-gray-700"
        >
          Manage projects
        </Link>
        <Link
          href="/admin/settings"
          className="block bg-white p-4 rounded-lg shadow-sm hover:shadow text-sm text-gray-700"
        >
          Site settings
        </Link>
      </div>
    </div>
  );
}
