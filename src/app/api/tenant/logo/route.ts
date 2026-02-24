// Copyright (c) 2026 Jérémy Vtipil
// Licensed under the GNU Affero General Public License v3.0

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { extname } from "path";
import { withAuth, ValidationError } from "@/lib/api";
import { ALLOWED_MIME_TYPES, UPLOAD_LIMITS } from "@/lib/schemas";
import { cleanupFiles, validateUpload } from "@/lib/files";
import { uploadFile } from "@/lib/storage";

export const POST = withAuth(async (req, { tenantId }) => {
  const formData = await req.formData();
  const file = formData.get("file") as File | null;

  if (!file) {
    throw new ValidationError("No file provided");
  }

  validateUpload(file, ALLOWED_MIME_TYPES, UPLOAD_LIMITS.media.maxSize);

  const tenant = await db.tenant.findUnique({ where: { id: tenantId } });
  if (!tenant) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const ext = extname(file.name).toLowerCase();
  const filename = `logo-${Date.now()}${ext}`;
  const key = `${tenant.slug}/${filename}`;

  await uploadFile(key, buffer, file.type || "application/octet-stream");

  const oldLogoUrl = tenant.logoUrl;

  await db.tenant.update({
    where: { id: tenantId },
    data: { logoUrl: key },
  });

  // Clean up previous logo file
  if (oldLogoUrl) {
    await cleanupFiles([oldLogoUrl]);
  }

  return NextResponse.json({ logoUrl: key });
});
