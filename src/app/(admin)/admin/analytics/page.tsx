// Copyright (c) 2026 Jérémy Vtipil
// Licensed under the GNU Affero General Public License v3.0

import { requireAuth } from "@/lib/auth";
import { AnalyticsDashboard } from "@/components/admin/analytics-dashboard";

export default async function AnalyticsPage() {
  await requireAuth();

  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-900 mb-8">Analytics</h1>
      <AnalyticsDashboard />
    </div>
  );
}
