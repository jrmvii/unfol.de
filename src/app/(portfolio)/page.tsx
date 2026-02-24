// Copyright (c) 2026 Jérémy Vtipil
// Licensed under the GNU Affero General Public License v3.0

export const revalidate = 300; // 5 minutes

import { notFound } from "next/navigation";
import { getTenantWithCategories } from "@/lib/tenant";
import { db } from "@/lib/db";
import { categoriesWithThumbnails } from "@/lib/queries";
import { Hero } from "@/components/portfolio/hero";
import { PageContent } from "@/components/portfolio/page-content";
import { AnalyticsTracker } from "@/components/portfolio/analytics-tracker";
import Link from "next/link";
import Image from "next/image";
import { optimizedMediaUrl } from "@/lib/media-utils";

export default async function HomePage() {
  const tenant = await getTenantWithCategories();
  if (!tenant) notFound();

  // If a homepage page is configured, render it after the hero
  if (tenant.homePageId) {
    const page = await db.page.findFirst({
      where: { id: tenant.homePageId, tenantId: tenant.id, published: true },
    });

    if (page) {
      return (
        <>
          <AnalyticsTracker pageType="home" />
          <Hero tenant={tenant} overlay />
          <div data-home-content>
            <PageContent page={page} />
          </div>
        </>
      );
    }
  }

  // Default: Hero + category grid
  const categoriesWithThumbs = await categoriesWithThumbnails(tenant.categories);

  return (
    <>
      <AnalyticsTracker pageType="home" />
      <Hero tenant={tenant} />

      <section className="px-6 pb-24">
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-3 gap-4">
          {categoriesWithThumbs.map((cat) => (
            <Link
              key={cat.id}
              href={`/${cat.slug}`}
              className="group relative aspect-square overflow-hidden"
            >
              {cat.thumbnail && (
                <Image
                  src={optimizedMediaUrl(cat.thumbnail)}
                  alt={cat.name}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                  sizes="(max-width: 768px) 50vw, 33vw"
                  {...(cat.thumbnail.blurDataUrl
                    ? { placeholder: "blur" as const, blurDataURL: cat.thumbnail.blurDataUrl }
                    : {})}
                />
              )}
              <div className="absolute inset-0 bg-black/20 flex items-end p-4 transition-opacity group-hover:bg-black/40">
                <span className="text-white text-sm font-bold uppercase tracking-wider">
                  {cat.name}
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </>
  );
}
