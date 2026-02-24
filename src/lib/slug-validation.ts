// Copyright (c) 2026 Jérémy Vtipil
// Licensed under the GNU Affero General Public License v3.0

import { db } from "./db";
import { RESERVED_SLUGS } from "./reserved-slugs";

type SlugResult =
  | { available: true }
  | { available: false; reason: string };

/**
 * Check if a tenant slug is available.
 * Validates against reserved slugs and existing tenants.
 */
export async function validateSlugAvailability(slug: string): Promise<SlugResult> {
  if (RESERVED_SLUGS.has(slug)) {
    return { available: false, reason: "This name is not available" };
  }

  const existing = await db.tenant.findUnique({
    where: { slug },
    select: { id: true },
  });
  if (existing) {
    return { available: false, reason: "This name is already taken" };
  }

  return { available: true };
}
