// Copyright (c) 2026 Jérémy Vtipil
// Licensed under the GNU Affero General Public License v3.0

import sharp from "sharp";

const MAX_WIDTH = 2400;
const BLUR_WIDTH = 10;
const WEBP_QUALITY = 80;

export interface OptimizeResult {
  optimizedBuffer: Buffer | null;
  blurDataUrl: string;
}

/**
 * Optimize a raster image: resize + WebP conversion + blur placeholder.
 * Returns null for non-raster formats (SVG, video).
 * For GIFs, only generates a blur placeholder (animation preserved).
 */
export async function optimizeImage(
  buffer: Buffer,
  mimeType: string,
): Promise<OptimizeResult | null> {
  if (mimeType === "image/svg+xml") return null;
  if (mimeType.startsWith("video/")) return null;

  // GIF: blur placeholder only (preserve animation)
  if (mimeType === "image/gif") {
    const blurDataUrl = await generateBlurDataUrl(buffer);
    return { optimizedBuffer: null, blurDataUrl };
  }

  // Raster: resize + WebP + blur
  const meta = await sharp(buffer).metadata();
  let pipeline = sharp(buffer);
  if (meta.width && meta.width > MAX_WIDTH) {
    pipeline = pipeline.resize(MAX_WIDTH);
  }
  const optimizedBuffer = await pipeline.webp({ quality: WEBP_QUALITY }).toBuffer();
  const blurDataUrl = await generateBlurDataUrl(buffer);

  return { optimizedBuffer, blurDataUrl };
}

async function generateBlurDataUrl(buffer: Buffer): Promise<string> {
  const tiny = await sharp(buffer)
    .resize(BLUR_WIDTH)
    .jpeg({ quality: 40 })
    .toBuffer();
  return `data:image/jpeg;base64,${tiny.toString("base64")}`;
}
