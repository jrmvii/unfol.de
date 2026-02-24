// Copyright (c) 2026 Jérémy Vtipil
// Licensed under the GNU Affero General Public License v3.0

import { requireAuth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getPlanLimits } from "@/lib/billing";
import { SettingsForm } from "@/components/admin/settings-form";

export default async function SettingsPage() {
  const { tenantId } = await requireAuth();

  const [tenant, pages, limits] = await Promise.all([
    db.tenant.findUnique({ where: { id: tenantId } }),
    db.page.findMany({
      where: { tenantId, published: true },
      orderBy: { title: "asc" },
      select: { id: true, title: true },
    }),
    getPlanLimits(tenantId),
  ]);

  if (!tenant) throw new Error("Tenant not found");

  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-900 mb-8">
        Site settings
      </h1>
      <SettingsForm tenant={tenant} pages={pages} canUseDomain={limits.customDomain} />
    </div>
  );
}
