// Copyright (c) 2026 Jérémy Vtipil
// Licensed under the GNU Affero General Public License v3.0

import { requireAuth } from "@/lib/auth";
import { db } from "@/lib/db";
import { ProjectEditor } from "@/components/admin/project-editor";

export default async function NewProjectPage() {
  const { tenantId } = await requireAuth();

  const categories = await db.category.findMany({
    where: { tenantId },
    orderBy: { sortOrder: "asc" },
  });

  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-900 mb-8">
        New project
      </h1>
      <ProjectEditor project={null} categories={categories} />
    </div>
  );
}
