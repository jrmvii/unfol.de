// Copyright (c) 2026 Jérémy Vtipil
// Licensed under the GNU Affero General Public License v3.0

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { withAuthParams, parseBody } from "@/lib/api";
import { pageUpdateSchema } from "@/lib/schemas";
import { logger } from "@/lib/logger";

export const GET = withAuthParams<{ id: string }>(async (_req, { tenantId }, { id }) => {
  const page = await db.page.findFirst({
    where: { id, tenantId },
  });

  if (!page) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(page);
});

export const PUT = withAuthParams<{ id: string }>(async (req, { tenantId }, { id }) => {
  const data = await parseBody(req, pageUpdateSchema);

  const page = await db.page.findFirst({ where: { id, tenantId } });
  if (!page) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const updated = await db.page.update({ where: { id }, data });
  return NextResponse.json(updated);
});

export const DELETE = withAuthParams<{ id: string }>(async (_req, { tenantId }, { id }) => {
  const page = await db.page.findFirst({ where: { id, tenantId }, select: { title: true } });
  if (!page) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await db.page.delete({ where: { id } });

  logger.info("page_deleted", { pageId: id, tenantId, title: page.title });
  return NextResponse.json({ ok: true });
});
