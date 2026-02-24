// Copyright (c) 2026 Jérémy Vtipil
// Licensed under the GNU Affero General Public License v3.0

import { requireAuth } from "@/lib/auth";
import { db } from "@/lib/db";
import { CategoryManager } from "@/components/admin/category-manager";

export default async function CategoriesPage() {
  const { tenantId } = await requireAuth();

  const categories = await db.category.findMany({
    where: { tenantId },
    orderBy: { sortOrder: "asc" },
    include: {
      _count: { select: { projects: true } },
    },
  });

  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-900 mb-8">Categories</h1>
      <CategoryManager categories={categories} />
    </div>
  );
}
