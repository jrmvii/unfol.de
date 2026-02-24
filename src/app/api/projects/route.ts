// Copyright (c) 2026 Jérémy Vtipil
// Licensed under the GNU Affero General Public License v3.0

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getTenant } from "@/lib/tenant";
import { withAuth, parseBody, nextSortOrder } from "@/lib/api";
import { projectCreateSchema } from "@/lib/schemas";
import { enforcePlanLimit } from "@/lib/billing";
import { logger } from "@/lib/logger";

export async function GET(req: Request) {
  const tenant = await getTenant();
  if (!tenant) {
    return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
  }

  const { searchParams } = new URL(req.url);
  const categoryId = searchParams.get("categoryId");

  const projects = await db.project.findMany({
    where: {
      tenantId: tenant.id,
      ...(categoryId ? { categoryId } : {}),
    },
    orderBy: { sortOrder: "asc" },
    include: {
      media: { orderBy: { sortOrder: "asc" }, take: 1 },
      category: { select: { name: true, slug: true } },
    },
  });

  return NextResponse.json(projects);
}

export const POST = withAuth(async (req, { tenantId }) => {
  await enforcePlanLimit(tenantId, "projects");
  const { title, slug, categoryId, description } = await parseBody(req, projectCreateSchema);
  const sortOrder = await nextSortOrder("project", { tenantId, categoryId });

  const project = await db.project.create({
    data: { tenantId, categoryId, title, slug, description, sortOrder },
  });

  logger.info("project_created", { projectId: project.id, tenantId, title });
  return NextResponse.json(project, { status: 201 });
});
