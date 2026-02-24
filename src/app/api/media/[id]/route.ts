// Copyright (c) 2026 Jérémy Vtipil
// Licensed under the GNU Affero General Public License v3.0

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { withAuthParams, parseBody } from "@/lib/api";
import { mediaUpdateSchema } from "@/lib/schemas";
import { cleanupFiles } from "@/lib/files";
import { logger } from "@/lib/logger";

export const PATCH = withAuthParams<{ id: string }>(async (req, { tenantId }, { id }) => {
  const data = await parseBody(req, mediaUpdateSchema);

  const media = await db.media.findUnique({
    where: { id },
    include: { project: true },
  });

  if (!media || media.project.tenantId !== tenantId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const updated = await db.media.update({
    where: { id },
    data,
  });

  return NextResponse.json(updated);
});

export const DELETE = withAuthParams<{ id: string }>(async (_req, { tenantId }, { id }) => {
  const media = await db.media.findUnique({
    where: { id },
    include: { project: true },
  });

  if (!media || media.project.tenantId !== tenantId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Delete DB record first, then clean up files
  await db.media.delete({ where: { id } });

  const filesToClean = [media.path];
  if (media.optimizedPath) filesToClean.push(media.optimizedPath);
  await cleanupFiles(filesToClean);

  logger.info("media_deleted", { mediaId: id, tenantId, filename: media.filename });
  return NextResponse.json({ ok: true });
});
