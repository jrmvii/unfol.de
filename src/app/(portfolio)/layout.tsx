// Copyright (c) 2026 Jérémy Vtipil
// Licensed under the GNU Affero General Public License v3.0

import { notFound } from "next/navigation";
import { getTenantWithCategories, tenantCanonicalBase } from "@/lib/tenant";
import { db } from "@/lib/db";
import { OverlayUI } from "@/components/portfolio/overlay-ui";
import { Footer } from "@/components/portfolio/footer";
import { HeroGate } from "@/components/portfolio/hero-gate";
import { mediaUrl } from "@/lib/media-utils";
import type { Metadata } from "next";

export const revalidate = 300; // 5 minutes

export async function generateMetadata(): Promise<Metadata> {
  const tenant = await getTenantWithCategories();
  if (!tenant) return {};

  const description = tenant.bio || `${tenant.name} — Portfolio`;
  const canonicalBase = tenantCanonicalBase(tenant);

  // Use first published project's first media as og:image
  const firstMedia = await db.media.findFirst({
    where: { project: { tenantId: tenant.id, published: true } },
    orderBy: [{ project: { sortOrder: "asc" } }, { sortOrder: "asc" }],
    select: { path: true, width: true, height: true },
  });

  const ogImage = firstMedia ? mediaUrl(firstMedia.path) : undefined;

  return {
    title: tenant.name,
    description,
    alternates: { canonical: canonicalBase },
    openGraph: {
      title: tenant.name,
      description,
      url: canonicalBase,
      type: "website",
      ...(ogImage && { images: [{ url: ogImage, width: firstMedia?.width ?? undefined, height: firstMedia?.height ?? undefined }] }),
    },
    twitter: {
      card: ogImage ? "summary_large_image" : "summary",
      title: tenant.name,
      description,
      ...(ogImage && { images: [ogImage] }),
    },
  };
}

export default async function PortfolioLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const tenant = await getTenantWithCategories();
  if (!tenant) notFound();

  const aboutPage = tenant.aboutPageId
    ? await db.page.findUnique({
        where: { id: tenant.aboutPageId },
        select: { slug: true },
      })
    : null;

  // Self-hosted: branding is always off
  const showBranding = false;

  const fontSource = tenant.fontSource as "system" | "google" | "custom";
  const fontFamily = tenant.fontFamily;
  const fontVar =
    fontSource === "system"
      ? fontFamily
      : `"${fontFamily}", sans-serif`;

  const canonicalUrl = tenantCanonicalBase(tenant);
  const sameAs = [tenant.instagramUrl, tenant.behanceUrl, tenant.linkedinUrl, tenant.websiteUrl].filter(Boolean);
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ProfilePage",
    name: tenant.name,
    url: canonicalUrl,
    mainEntity: {
      "@type": "Person",
      name: tenant.name,
      url: canonicalUrl,
      ...(tenant.bio && { description: tenant.bio }),
      ...(sameAs.length && { sameAs }),
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {/* Google Fonts: load from CDN */}
      {fontSource === "google" && fontFamily && (
        <>
          <link rel="preconnect" href="https://fonts.googleapis.com" />
          <link
            rel="preconnect"
            href="https://fonts.gstatic.com"
            crossOrigin="anonymous"
          />
          <link
            rel="stylesheet"
            href={`https://fonts.googleapis.com/css2?family=${encodeURIComponent(fontFamily)}:wght@400;700&display=swap`}
          />
        </>
      )}

      {/* Custom upload: @font-face from uploaded woff2 files */}
      {fontSource === "custom" && fontFamily && (
        <style
          dangerouslySetInnerHTML={{
            __html: `
              @font-face {
                font-family: "${fontFamily}";
                src: url("${mediaUrl(`${tenant.slug}/fonts/regular.woff2`)}") format("woff2");
                font-weight: 400;
                font-display: swap;
              }
              @font-face {
                font-family: "${fontFamily}";
                src: url("${mediaUrl(`${tenant.slug}/fonts/bold.woff2`)}") format("woff2");
                font-weight: 700;
                font-display: swap;
              }
            `,
          }}
        />
      )}

      <div
        style={
          {
            "--primary": tenant.primaryColor,
            "--bg": tenant.bgColor,
            "--font": fontVar,
            fontFamily: "var(--font)",
          } as React.CSSProperties
        }
        data-transition={tenant.transitionStyle}
        className="min-h-screen bg-[var(--bg)]"
      >
        <HeroGate duration={tenant.heroDuration}>
          <OverlayUI
            tenant={tenant}
            categories={tenant.categories}
            aboutSlug={aboutPage?.slug}
          />

          <main>{children}</main>

          {tenant.portfolioLayout !== "fullscreen" && <Footer tenant={tenant} showBranding={showBranding} />}
        </HeroGate>
      </div>
    </>
  );
}
