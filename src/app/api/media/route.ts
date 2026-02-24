// Copyright (c) 2026 Jérémy Vtipil
// Licensed under the GNU Affero General Public License v3.0

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { extname } from "path";
import sharp from "sharp";
import { withAuth, ValidationError, nextSortOrder } from "@/lib/api";
import { ALLOWED_MIME_TYPES, UPLOAD_LIMITS } from "@/lib/schemas";
import { validateUpload } from "@/lib/files";
import { enforcePlanLimit } from "@/lib/billing";
import { optimizeImage } from "@/lib/image-optimize";
import { requireEmailVerified } from "@/lib/email-verification";
import { uploadFile } from "@/lib/storage";

export const GET = withAuth(async (_req, { tenantId }) => {
  const media = await db.media.findMany({
    where: { project: { tenantId } },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(media);
});

export const POST = withAuth(async (req, { tenantId, userId }) => {
  await requireEmailVerified(userId);
  await enforcePlanLimit(tenantId, "storage");
  const formData = await req.formData();
  const projectId = formData.get("projectId") as string;

  if (!projectId) {
    throw new ValidationError("projectId required");
  }

  const project = await db.project.findFirst({
    where: { id: projectId, tenantId },
    include: { category: true, tenant: true },
  });
  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  const files = formData.getAll("files") as File[];
  if (files.length === 0) {
    throw new ValidationError("No files provided");
  }

  // Pre-validate all files before uploading anything
  for (const file of files) {
    validateUpload(file, ALLOWED_MIME_TYPES, UPLOAD_LIMITS.media.maxSize);
  }

  let nextOrder = await nextSortOrder("media", { projectId });

  const created = [];

  for (const file of files) {
    const mimeType = file.type || "application/octet-stream";
    const buffer = Buffer.from(await file.arrayBuffer());
    const ext = extname(file.name).toLowerCase();
    const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`;
    const key = `${project.tenant.slug}/${project.category.slug}/${filename}`;

    await uploadFile(key, buffer, mimeType);

    let width: number | undefined;
    let height: number | undefined;
    let blurDataUrl: string | undefined;
    let optimizedPath: string | undefined;

    if (mimeType.startsWith("image/")) {
      const meta = await sharp(buffer).metadata();
      width = meta.width;
      height = meta.height;

      const result = await optimizeImage(buffer, mimeType);
      if (result) {
        blurDataUrl = result.blurDataUrl;
        if (result.optimizedBuffer) {
          const optFilename = filename.replace(/\.[^.]+$/, "-opt.webp");
          const optKey = `${project.tenant.slug}/${project.category.slug}/${optFilename}`;
          await uploadFile(optKey, result.optimizedBuffer, "image/webp");
          optimizedPath = optKey;
        }
      }
    }

    const media = await db.media.create({
      data: {
        projectId,
        filename: file.name,
        path: key,
        mimeType,
        width,
        height,
        sizeBytes: buffer.length,
        sortOrder: nextOrder++,
        blurDataUrl,
        optimizedPath,
      },
    });

    created.push(media);
  }

  return NextResponse.json(created, { status: 201 });
});
