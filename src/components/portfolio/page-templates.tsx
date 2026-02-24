// Copyright (c) 2026 Jérémy Vtipil
// Licensed under the GNU Affero General Public License v3.0

import Image from "next/image";
import type { Page, Media } from "@prisma/client";
import type { ColumnBlock } from "@/lib/schemas";
import { layoutToGridCols } from "@/lib/schemas";
import { renderTextBlock } from "@/lib/render-text";
import { optimizedMediaUrl } from "@/lib/media-utils";
import { MasonryGrid } from "./masonry-grid";

function PageTitle({ page }: { page: Page }) {
  if (!page.showTitle) return null;
  return (
    <h1
      className="text-lg font-bold uppercase tracking-wider"
      style={{ color: "var(--primary)" }}
    >
      {page.title}
    </h1>
  );
}

export function TextCenteredPage({ page }: { page: Page }) {
  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="max-w-lg text-center space-y-6">
        <PageTitle page={page} />
        {page.content && (
          <div style={{ color: "var(--primary)" }}>
            {renderTextBlock(page.content)}
          </div>
        )}
      </div>
    </div>
  );
}

export function TextWidePage({ page }: { page: Page }) {
  return (
    <div className="min-h-screen pt-20 pb-24">
      <div className="max-w-4xl mx-auto px-6 space-y-6">
        <PageTitle page={page} />
        {page.content && (
          <div style={{ color: "var(--primary)" }}>
            {renderTextBlock(page.content)}
          </div>
        )}
      </div>
    </div>
  );
}

export function TextColumnsPage({
  page,
  blocks,
  gridCols,
  mediaMap,
}: {
  page: Page;
  blocks: ColumnBlock[];
  gridCols: string;
  mediaMap: Record<string, Media>;
}) {
  const hasTitle = page.showTitle;

  return (
    <div className="min-h-screen pt-20 pb-24">
      <div className="max-w-5xl mx-auto px-6">
        <PageTitle page={page} />
        <div
          className={`${hasTitle ? "mt-6" : ""} grid gap-8 min-h-[60vh]`}
          style={{ gridTemplateColumns: gridCols }}
        >
          {blocks.map((block, i) => {
            if (block.type === "media" && mediaMap[block.mediaId]) {
              const m = mediaMap[block.mediaId];
              return (
                <Image
                  key={i}
                  src={optimizedMediaUrl(m)}
                  alt={m.altText || ""}
                  width={m.width || 800}
                  height={m.height || 600}
                  className="w-full h-full object-cover"
                  sizes="(max-width: 768px) 100vw, 50vw"
                  style={{ width: "100%", height: "100%" }}
                  {...(m.blurDataUrl
                    ? { placeholder: "blur" as const, blurDataURL: m.blurDataUrl }
                    : {})}
                />
              );
            }
            if (block.type === "text") {
              return (
                <div key={i} style={{ color: "var(--primary)" }}>
                  {renderTextBlock(block.content)}
                </div>
              );
            }
            return null;
          })}
        </div>
      </div>
    </div>
  );
}

export function MasonryPage({
  page,
  images,
  gap,
}: {
  page: Page;
  images: Media[];
  gap?: number;
}) {
  const columns = page.columns >= 2 ? page.columns : 3;

  return (
    <div className="min-h-screen pt-20 pb-24">
      {page.showTitle && (
        <div className="max-w-6xl mx-auto px-4 mb-8">
          <PageTitle page={page} />
        </div>
      )}
      <MasonryGrid images={images} columns={columns} gap={gap} />
    </div>
  );
}
