// Copyright (c) 2026 Jérémy Vtipil
// Licensed under the GNU Affero General Public License v3.0

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { withAuth, ValidationError } from "@/lib/api";
import { UPLOAD_LIMITS } from "@/lib/schemas";
import { uploadFile } from "@/lib/storage";

export const POST = withAuth(async (req, { tenantId }) => {
  const formData = await req.formData();
  const weight = formData.get("weight") as string;
  const file = formData.get("file") as File | null;

  if (!file) throw new ValidationError("No file provided");
  if (!["regular", "bold"].includes(weight)) {
    throw new ValidationError("Weight must be 'regular' or 'bold'");
  }
  if (!file.name.endsWith(".woff2")) {
    throw new ValidationError("Only .woff2 files are accepted");
  }
  if (file.size > UPLOAD_LIMITS.font.maxSize) {
    throw new ValidationError("Font file exceeds 2 MB limit");
  }

  const tenant = await db.tenant.findUnique({ where: { id: tenantId }, select: { slug: true } });
  if (!tenant) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const key = `${tenant.slug}/fonts/${weight}.woff2`;
  await uploadFile(key, buffer, "font/woff2");

  return NextResponse.json({ ok: true, weight });
});
