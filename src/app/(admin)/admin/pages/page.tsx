// Copyright (c) 2026 Jérémy Vtipil
// Licensed under the GNU Affero General Public License v3.0

import { requireAuth } from "@/lib/auth";
import { db } from "@/lib/db";
import { PageManager } from "@/components/admin/page-manager";

export default async function PagesPage() {
  const { tenantId } = await requireAuth();

  const [pages, tenant] = await Promise.all([
    db.page.findMany({
      where: { tenantId },
      orderBy: { sortOrder: "asc" },
    }),
    db.tenant.findUnique({
      where: { id: tenantId },
      select: { aboutPageId: true, homePageId: true },
    }),
  ]);

  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-900 mb-8">Pages</h1>
      <PageManager
        pages={pages}
        aboutPageId={tenant?.aboutPageId || null}
        homePageId={tenant?.homePageId || null}
      />
    </div>
  );
}
