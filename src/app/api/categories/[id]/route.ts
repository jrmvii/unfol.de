// Copyright (c) 2026 Jérémy Vtipil
// Licensed under the GNU Affero General Public License v3.0

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { withAuthParams, parseBody } from "@/lib/api";
import { categoryUpdateSchema } from "@/lib/schemas";
import { cleanupFiles } from "@/lib/files";
import { logger } from "@/lib/logger";

export const PUT = withAuthParams<{ id: string }>(async (req, { tenantId }, { id }) => {
  const data = await parseBody(req, categoryUpdateSchema);

  const category = await db.category.findFirst({ where: { id, tenantId } });
  if (!category) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const updated = await db.category.update({ where: { id }, data });
  return NextResponse.json(updated);
});

export const DELETE = withAuthParams<{ id: string }>(async (_req, { tenantId }, { id }) => {
  const category = await db.category.findFirst({
    where: { id, tenantId },
    include: { projects: { include: { media: { select: { path: true } } } } },
  });

  if (!category) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  logger.info("category_deleting", { categoryId: id, tenantId, name: category.name });

  // Delete DB record first (cascade removes projects + media rows), then clean up files
  const allMedia = category.projects.flatMap((p) => p.media);
  await db.category.delete({ where: { id } });
  await cleanupFiles(allMedia.map((m) => m.path));

  logger.info("category_deleted", { categoryId: id, tenantId, name: category.name });
  return NextResponse.json({ ok: true });
});
