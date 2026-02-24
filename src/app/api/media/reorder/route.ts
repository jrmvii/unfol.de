// Copyright (c) 2026 Jérémy Vtipil
// Licensed under the GNU Affero General Public License v3.0

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { withAuth, parseBody } from "@/lib/api";
import { reorderSchema } from "@/lib/schemas";

export const PUT = withAuth(async (req, { tenantId }) => {
  const items = await parseBody(req, reorderSchema);

  const mediaIds = items.map((i) => i.id);
  const owned = await db.media.findMany({
    where: { id: { in: mediaIds } },
    include: { project: { select: { tenantId: true } } },
  });

  const allOwned = owned.every((m) => m.project.tenantId === tenantId);
  if (!allOwned) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await db.$transaction(
    items.map((item) =>
      db.media.update({
        where: { id: item.id },
        data: { sortOrder: item.sortOrder },
      })
    )
  );

  return NextResponse.json({ ok: true });
});
