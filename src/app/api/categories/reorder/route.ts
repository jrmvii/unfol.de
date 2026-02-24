// Copyright (c) 2026 Jérémy Vtipil
// Licensed under the GNU Affero General Public License v3.0

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { withAuth, parseBody } from "@/lib/api";
import { reorderSchema } from "@/lib/schemas";

export const PUT = withAuth(async (req, { tenantId }) => {
  const items = await parseBody(req, reorderSchema);

  await db.$transaction(
    items.map((item) =>
      db.category.updateMany({
        where: { id: item.id, tenantId },
        data: { sortOrder: item.sortOrder },
      })
    )
  );

  return NextResponse.json({ ok: true });
});
