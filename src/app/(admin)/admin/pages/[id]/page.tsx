// Copyright (c) 2026 Jérémy Vtipil
// Licensed under the GNU Affero General Public License v3.0

import { notFound } from "next/navigation";
import { requireAuth } from "@/lib/auth";
import { db } from "@/lib/db";
import { PageEditor } from "@/components/admin/page-editor";

export default async function EditPagePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { tenantId } = await requireAuth();
  const { id } = await params;

  const page = await db.page.findFirst({
    where: { id, tenantId },
  });

  if (!page) notFound();

  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-900 mb-8">Edit page</h1>
      <PageEditor page={page} />
    </div>
  );
}
