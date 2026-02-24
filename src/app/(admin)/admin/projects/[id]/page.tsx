// Copyright (c) 2026 Jérémy Vtipil
// Licensed under the GNU Affero General Public License v3.0

import { requireAuth } from "@/lib/auth";
import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import { ProjectEditor } from "@/components/admin/project-editor";

export default async function EditProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { tenantId } = await requireAuth();
  const { id } = await params;

  const project = await db.project.findFirst({
    where: { id, tenantId },
    include: {
      media: { orderBy: { sortOrder: "asc" } },
      category: true,
    },
  });

  if (!project) notFound();

  const categories = await db.category.findMany({
    where: { tenantId },
    orderBy: { sortOrder: "asc" },
  });

  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-900 mb-8">
        Edit: {project.title}
      </h1>
      <ProjectEditor project={project} categories={categories} />
    </div>
  );
}
