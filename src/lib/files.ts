// Copyright (c) 2026 Jérémy Vtipil
// Licensed under the GNU Affero General Public License v3.0

import { deleteFile } from "@/lib/storage";
import { ValidationError } from "@/lib/api";
import { logger } from "@/lib/logger";

/**
 * Remove uploaded files from S3 storage. Logs warnings on failure instead of throwing.
 */
export async function cleanupFiles(paths: string[]): Promise<void> {
  await Promise.all(
    paths.map((p) =>
      deleteFile(p).catch((err: unknown) => {
        logger.warn("file_cleanup_failed", { path: p, error: String(err) });
      })
    )
  );
}

/**
 * Validate an uploaded file against allowed MIME types and max size.
 * Throws ValidationError on failure.
 */
export function validateUpload(
  file: File,
  allowedTypes: Set<string>,
  maxSize: number
): void {
  const mimeType = file.type || "application/octet-stream";
  if (!allowedTypes.has(mimeType)) {
    throw new ValidationError(`File type "${mimeType}" is not allowed`);
  }
  if (file.size > maxSize) {
    throw new ValidationError(`File "${file.name}" exceeds ${Math.round(maxSize / 1024 / 1024)} MB limit`);
  }
}
