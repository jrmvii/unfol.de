// Copyright (c) 2026 Jérémy Vtipil
// Licensed under the GNU Affero General Public License v3.0

import { db } from "@/lib/db";
import {
  TextCenteredPage,
  TextWidePage,
  TextColumnsPage,
  MasonryPage,
} from "@/components/portfolio/page-templates";
import type { ColumnBlock } from "@/lib/schemas";
import { layoutToGridCols } from "@/lib/schemas";
import type { Page } from "@prisma/client";

export async function PageContent({ page }: { page: Page }) {
  if (page.template === "text-wide") {
    return <TextWidePage page={page} />;
  }

  if (page.template === "masonry") {
    let mediaIds: string[] = [];
    let gap: number | undefined;
    try {
      const parsed = JSON.parse(page.content);
      if (parsed && Array.isArray(parsed.mediaIds)) {
        mediaIds = parsed.mediaIds;
      }
      if (parsed && typeof parsed.gap === "number") {
        gap = parsed.gap;
      }
    } catch {
      // invalid JSON
    }

    const images =
      mediaIds.length > 0
        ? await db.media.findMany({ where: { id: { in: mediaIds } } })
        : [];

    const mediaMap = new Map(images.map((m) => [m.id, m]));
    const ordered = mediaIds
      .map((id) => mediaMap.get(id))
      .filter((m): m is NonNullable<typeof m> => m != null);

    return <MasonryPage page={page} images={ordered} gap={gap} />;
  }

  if (page.template === "text-columns") {
    let blocks: ColumnBlock[] = [];
    let gridCols = `repeat(${page.columns > 1 ? page.columns : 2}, 1fr)`;

    try {
      const parsed = JSON.parse(page.content);
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed) && parsed.blocks) {
        blocks = parsed.blocks;
        gridCols = layoutToGridCols(parsed.layout || "1-1");
      } else if (Array.isArray(parsed)) {
        blocks = parsed;
      }
    } catch {
      // legacy plain text
    }

    const mediaIds = blocks
      .filter((b): b is { type: "media"; mediaId: string } => b.type === "media")
      .map((b) => b.mediaId);
    const mediaRecords =
      mediaIds.length > 0
        ? await db.media.findMany({ where: { id: { in: mediaIds } } })
        : [];
    const mediaMap = Object.fromEntries(mediaRecords.map((m) => [m.id, m]));

    return (
      <TextColumnsPage
        page={page}
        blocks={blocks}
        gridCols={gridCols}
        mediaMap={mediaMap}
      />
    );
  }

  // Default: text-centered
  return <TextCenteredPage page={page} />;
}
