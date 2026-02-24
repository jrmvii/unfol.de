// Copyright (c) 2026 Jérémy Vtipil
// Licensed under the GNU Affero General Public License v3.0

import type { MetadataRoute } from "next";
import { db } from "@/lib/db";
import { ROOT_DOMAINS } from "@/lib/constants";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const rootDomain = ROOT_DOMAINS[0] || "unfol.de";
  const baseUrl = `https://${rootDomain}`;

  // Static landing pages
  const staticPages: MetadataRoute.Sitemap = [
    { url: baseUrl, lastModified: new Date(), changeFrequency: "weekly", priority: 1 },
    { url: `${baseUrl}/pricing`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.8 },
    { url: `${baseUrl}/signup`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.7 },
  ];

  // All tenants + their categories
  const tenants = await db.tenant.findMany({
    select: {
      slug: true,
      domain: true,
      updatedAt: true,
      categories: { select: { slug: true, updatedAt: true } },
    },
  });

  const tenantEntries: MetadataRoute.Sitemap = tenants.flatMap((t) => {
    const tenantBase = t.domain
      ? `https://${t.domain}`
      : `https://${t.slug}.${rootDomain}`;

    return [
      {
        url: tenantBase,
        lastModified: t.updatedAt,
        changeFrequency: "weekly" as const,
        priority: 0.6,
      },
      ...t.categories.map((c) => ({
        url: `${tenantBase}/${c.slug}`,
        lastModified: c.updatedAt,
        changeFrequency: "weekly" as const,
        priority: 0.5,
      })),
    ];
  });

  return [...staticPages, ...tenantEntries];
}
