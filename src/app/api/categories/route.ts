// Copyright (c) 2026 Jérémy Vtipil
// Licensed under the GNU Affero General Public License v3.0

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getTenant } from "@/lib/tenant";
import { withAuth, parseBody, nextSortOrder } from "@/lib/api";
import { categoryCreateSchema } from "@/lib/schemas";
import { logger } from "@/lib/logger";

export async function GET() {
  const tenant = await getTenant();
  if (!tenant) {
    return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
  }

  const categories = await db.category.findMany({
    where: { tenantId: tenant.id },
    orderBy: { sortOrder: "asc" },
    include: {
      _count: { select: { projects: true } },
    },
  });

  return NextResponse.json(categories);
}

export const POST = withAuth(async (req, { tenantId }) => {
  const { name, slug } = await parseBody(req, categoryCreateSchema);
  const sortOrder = await nextSortOrder("category", { tenantId });

  const category = await db.category.create({
    data: { tenantId, name, slug, sortOrder },
  });

  logger.info("category_created", { categoryId: category.id, tenantId, name });
  return NextResponse.json(category, { status: 201 });
});
