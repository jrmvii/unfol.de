// Copyright (c) 2026 Jérémy Vtipil
// Licensed under the GNU Affero General Public License v3.0

import { db } from "./db";
import type { Category, Media } from "@prisma/client";

/**
 * Get the first image thumbnail for each category in a single query.
 * Replaces the N+1 pattern of querying per-category.
 */
export async function getCategoryThumbnails(
  categoryIds: string[]
): Promise<Map<string, Media>> {
  if (categoryIds.length === 0) return new Map();

  // Get the first published project with an image for each category
  const projects = await db.project.findMany({
    where: {
      categoryId: { in: categoryIds },
      published: true,
    },
    orderBy: { sortOrder: "asc" },
    include: {
      media: {
        where: { mimeType: { startsWith: "image/" } },
        take: 1,
        orderBy: { sortOrder: "asc" },
      },
    },
  });

  // Build a map: categoryId -> first image (only keep the first match per category)
  const thumbs = new Map<string, Media>();
  for (const project of projects) {
    if (project.media[0] && !thumbs.has(project.categoryId)) {
      thumbs.set(project.categoryId, project.media[0]);
    }
  }

  return thumbs;
}

export type CategoryWithThumb = Category & { thumbnail: Media | null };

/**
 * Enrich categories with their thumbnail in a single batch query.
 */
export async function categoriesWithThumbnails(
  categories: Category[]
): Promise<CategoryWithThumb[]> {
  const thumbs = await getCategoryThumbnails(categories.map((c) => c.id));
  return categories.map((cat) => ({
    ...cat,
    thumbnail: thumbs.get(cat.id) || null,
  }));
}
