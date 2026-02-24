// Copyright (c) 2026 Jérémy Vtipil
// Licensed under the GNU Affero General Public License v3.0

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { withAuth, parseBody, nextSortOrder } from "@/lib/api";
import { pageCreateSchema } from "@/lib/schemas";
import { enforcePlanLimit } from "@/lib/billing";
import { logger } from "@/lib/logger";

export const GET = withAuth(async (_req, { tenantId }) => {
  const pages = await db.page.findMany({
    where: { tenantId },
    orderBy: { sortOrder: "asc" },
  });

  return NextResponse.json(pages);
});

export const POST = withAuth(async (req, { tenantId }) => {
  await enforcePlanLimit(tenantId, "pages");
  const { title, slug, content, template, columns, showTitle } = await parseBody(req, pageCreateSchema);
  const sortOrder = await nextSortOrder("page", { tenantId });

  const page = await db.page.create({
    data: {
      tenantId, title, slug,
      content: content || "",
      template: template || "text-centered",
      columns: columns || 1,
      showTitle: showTitle ?? true,
      sortOrder,
    },
  });

  logger.info("page_created", { pageId: page.id, tenantId, title });
  return NextResponse.json(page, { status: 201 });
});
