// Copyright (c) 2026 Jérémy Vtipil
// Licensed under the GNU Affero General Public License v3.0

"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import type { Media } from "@prisma/client";
import { optimizedMediaUrl } from "@/lib/media-utils";

const gridColsClass: Record<number, string> = {
  1: "grid grid-cols-1 gap-2",
  2: "grid grid-cols-1 md:grid-cols-2 gap-2",
  3: "grid grid-cols-1 md:grid-cols-3 gap-2",
  4: "grid grid-cols-2 md:grid-cols-4 gap-2",
};

export function ImageGrid({
  images,
  layout = "standard",
  columns = 1,
}: {
  images: Media[];
  layout?: "standard" | "fullscreen";
  columns?: number;
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

  const isFullscreen = layout === "fullscreen";
  const isMultiCol = columns >= 2;

  const outerClass = isFullscreen
    ? isMultiCol ? `w-full px-2 ${gridColsClass[columns] || ""}` : "w-full"
    : isMultiCol ? `max-w-6xl mx-auto px-4 ${gridColsClass[columns] || ""}` : "max-w-4xl mx-auto px-4 space-y-2";

  const sizesAttr = isFullscreen
    ? isMultiCol ? `(max-width: 768px) 100vw, ${Math.round(100 / columns)}vw` : "100vw"
    : isMultiCol ? `(max-width: 768px) 100vw, ${Math.round(1152 / columns)}px` : "(max-width: 768px) 100vw, 896px";

  return (
    <div ref={containerRef} className={outerClass}>
      {images.map((img) => (
        <figure key={img.id} className="fade-in m-0">
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
