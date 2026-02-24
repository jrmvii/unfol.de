// Copyright (c) 2026 Jérémy Vtipil
// Licensed under the GNU Affero General Public License v3.0

import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  DeleteObjectsCommand,
} from "@aws-sdk/client-s3";

const s3 = new S3Client({
  region: process.env.S3_REGION || "auto",
  endpoint: process.env.S3_ENDPOINT!,
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY!,
    secretAccessKey: process.env.S3_SECRET_KEY!,
  },
});

const BUCKET = process.env.S3_BUCKET!;
const MEDIA_BASE = process.env.MEDIA_BASE_URL || "";

/**
 * Upload a file to S3-compatible storage (Cloudflare R2).
 */
export async function uploadFile(
  key: string,
  body: Buffer,
  contentType: string,
): Promise<void> {
  await s3.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: body,
      ContentType: contentType,
    }),
  );
}

/**
 * Delete a single file from storage.
 */
export async function deleteFile(key: string): Promise<void> {
  await s3.send(
    new DeleteObjectCommand({
      Bucket: BUCKET,
      Key: key,
    }),
  );
}

/**
 * Delete multiple files from storage in a single request.
 */
export async function deleteFiles(keys: string[]): Promise<void> {
  if (keys.length === 0) return;
  await s3.send(
    new DeleteObjectsCommand({
      Bucket: BUCKET,
      Delete: { Objects: keys.map((Key) => ({ Key })) },
    }),
  );
}

/**
 * Build a public URL for a stored file.
 */
export function mediaUrl(path: string): string {
  if (!path) return "";
  return `${MEDIA_BASE}/${path}`;
}

/**
 * Build a public URL preferring the optimized variant.
 */
export function optimizedMediaUrl(media: {
  path: string;
  optimizedPath?: string | null;
}): string {
  return mediaUrl(media.optimizedPath || media.path);
}
