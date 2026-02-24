// Copyright (c) 2026 Jérémy Vtipil
// Licensed under the GNU Affero General Public License v3.0

import { headers } from "next/headers";
import { db } from "./db";
import { buildTenantUrl } from "./constants";

export function tenantCanonicalBase(tenant: { slug: string; domain: string | null }): string {
  return tenant.domain
    ? `https://${tenant.domain}`
    : buildTenantUrl(tenant.slug, "");
}

export async function getTenantSlug(): Promise<string | null> {
  const headersList = await headers();
  return headersList.get("x-tenant-slug") || null;
}

export async function getTenant() {
  const slug = await getTenantSlug();
  if (!slug) return null;

  return db.tenant.findFirst({
    where: {
      OR: [{ slug }, { domain: slug }],
    },
  });
}

export async function getTenantWithCategories() {
  const slug = await getTenantSlug();
  if (!slug) return null;

  return db.tenant.findFirst({
    where: {
      OR: [{ slug }, { domain: slug }],
    },
    include: {
      categories: {
        orderBy: { sortOrder: "asc" },
      },
    },
  });
}
