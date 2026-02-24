// Copyright (c) 2026 Jérémy Vtipil
// Licensed under the GNU Affero General Public License v3.0

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { withAuthParams, parseBody } from "@/lib/api";
import { projectUpdateSchema } from "@/lib/schemas";
import { cleanupFiles } from "@/lib/files";
import { logger } from "@/lib/logger";

export const PUT = withAuthParams<{ id: string }>(async (req, { tenantId }, { id }) => {
  const data = await parseBody(req, projectUpdateSchema);

  const project = await db.project.findFirst({ where: { id, tenantId } });
  if (!project) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const updated = await db.project.update({
    where: { id },
    data,
    include: { media: { orderBy: { sortOrder: "asc" } } },
  });
  return NextResponse.json(updated);
});

export const DELETE = withAuthParams<{ id: string }>(async (_req, { tenantId }, { id }) => {
  const project = await db.project.findFirst({
    where: { id, tenantId },
    include: { media: { select: { path: true } } },
  });

  if (!project) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  logger.info("project_deleting", { projectId: id, tenantId, title: project.title });

  // Delete DB record first (cascade removes media rows), then clean up files
  await db.project.delete({ where: { id } });
  await cleanupFiles(project.media.map((m) => m.path));

  logger.info("project_deleted", { projectId: id, tenantId, title: project.title });
  return NextResponse.json({ ok: true });
});
