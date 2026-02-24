// Copyright (c) 2026 Jérémy Vtipil
// Licensed under the GNU Affero General Public License v3.0

import { notFound } from "next/navigation";
import { getTenant, tenantCanonicalBase } from "@/lib/tenant";
import { db } from "@/lib/db";
import { ImageGrid } from "@/components/portfolio/image-grid";
import { VideoPlayer } from "@/components/portfolio/video-player";
import { PageContent } from "@/components/portfolio/page-content";
import { AnalyticsTracker } from "@/components/portfolio/analytics-tracker";
import { mediaUrl } from "@/lib/media-utils";
import { safeLayout } from "@/lib/schemas";
import type { Metadata } from "next";

export const revalidate = 300; // 5 minutes

export async function generateMetadata({
  params,
}: {
  params: Promise<{ category: string }>;
}): Promise<Metadata> {
  const { category: slug } = await params;
  const tenant = await getTenant();
  if (!tenant) return {};

  return {
    alternates: {
      canonical: `${tenantCanonicalBase(tenant)}/${slug}`,
    },
  };
}

export default async function SlugPage({
  params,
}: {
  params: Promise<{ category: string }>;
}) {
  const { category: slug } = await params;
  const tenant = await getTenant();
  if (!tenant) notFound();

  // Try category first
  const category = await db.category.findFirst({
    where: { tenantId: tenant.id, slug },
  });

  if (category) {
    const projects = await db.project.findMany({
      where: { categoryId: category.id, published: true },
      orderBy: { sortOrder: "asc" },
      include: {
        media: { orderBy: { sortOrder: "asc" } },
      },
    });

    const allMedia = projects.flatMap((p) => p.media);
    const images = allMedia.filter((m) => m.mimeType.startsWith("image/"));
    const videos = allMedia.filter((m) => m.mimeType.startsWith("video/"));

    const layout = safeLayout(tenant.portfolioLayout);
    const isFullscreen = layout === "fullscreen";

    return (
      <div className={isFullscreen ? "" : "pt-20 pb-24"}>
        <AnalyticsTracker pageType="category" resourceId={category.id} />
        {videos.map((video) => (
          <VideoPlayer
            key={video.id}
            src={mediaUrl(video.path)}
            layout={layout}
          />
        ))}
        <ImageGrid images={images} layout={layout} columns={category.columnCount} />
      </div>
    );
  }

  // Fallback: try page
  const page = await db.page.findFirst({
    where: { tenantId: tenant.id, slug, published: true },
  });
  if (!page) notFound();

  return (
    <>
      <AnalyticsTracker pageType="page" resourceId={page.id} />
      <PageContent page={page} />
    </>
  );
}
