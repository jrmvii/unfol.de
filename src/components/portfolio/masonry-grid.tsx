// Copyright (c) 2026 Jérémy Vtipil
// Licensed under the GNU Affero General Public License v3.0

"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import type { Media } from "@prisma/client";
import { optimizedMediaUrl } from "@/lib/media-utils";

export function MasonryGrid({
  images,
  columns = 3,
  gap = 8,
}: {
  images: Media[];
  columns?: number;
  gap?: number;
}) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
          }
        });
      },
      { threshold: 0.1 }
    );

    const items = containerRef.current.querySelectorAll(".fade-in");
    items.forEach((item) => observer.observe(item));

    return () => observer.disconnect();
  }, []);

  const cols = Math.max(2, columns);
  const sizesAttr = `(max-width: 768px) 100vw, ${Math.round(1152 / cols)}px`;

  return (
    <div
      ref={containerRef}
      className="max-w-6xl mx-auto px-4"
      data-masonry
      style={{
        columnCount: cols,
        columnGap: `${gap}px`,
      }}
    >
      {images.map((img) => (
        <figure
          key={img.id}
          className="fade-in m-0"
          style={{ breakInside: "avoid", marginBottom: `${gap}px` }}
        >
          <Image
            src={optimizedMediaUrl(img)}
            alt={img.altText || ""}
            width={img.width || 1200}
            height={img.height || 800}
            className="w-full h-auto block"
            sizes={sizesAttr}
            loading="lazy"
            {...(img.blurDataUrl
              ? { placeholder: "blur" as const, blurDataURL: img.blurDataUrl }
              : {})}
          />
        </figure>
      ))}
    </div>
  );
}
