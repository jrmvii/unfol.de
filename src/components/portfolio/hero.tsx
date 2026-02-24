// Copyright (c) 2026 Jérémy Vtipil
// Licensed under the GNU Affero General Public License v3.0

import type { Tenant } from "@prisma/client";
import { VIDEO_EXTS, getYouTubeId, mediaUrl } from "@/lib/media-utils";

export function Hero({ tenant, overlay }: { tenant: Tenant; overlay?: boolean }) {
  const url = tenant.logoUrl || "";
  const ytId = getYouTubeId(url);
  const isVideo = !ytId && VIDEO_EXTS.test(url);
  const isImage = url && !ytId && !isVideo;

  return (
    <section
      className="h-screen flex items-center justify-center relative"
      style={overlay ? { position: "absolute", top: 0, left: 0, right: 0, zIndex: 10, opacity: 0, pointerEvents: "none" } : undefined}
    >
      {ytId && (
        <iframe
          src={`https://www.youtube.com/embed/${ytId}?autoplay=1&mute=1&loop=1&playlist=${ytId}&controls=0&showinfo=0&rel=0&modestbranding=1`}
          allow="autoplay; encrypted-media"
          allowFullScreen
          className="w-full max-w-4xl aspect-video"
          style={{ border: 0 }}
        />
      )}
      {isVideo && (
        <video
          src={mediaUrl(url)}
          autoPlay
          loop
          muted
          playsInline
          className="max-h-[60vh] w-auto"
        />
      )}
      {isImage && (
        <img
          src={mediaUrl(url)}
          alt={tenant.name}
          className="max-w-xs"
        />
      )}
      {!url && (
        <h1
          className="text-4xl md:text-6xl font-bold uppercase tracking-widest"
          style={{ color: "var(--primary)" }}
        >
          {tenant.name}
        </h1>
      )}
    </section>
  );
}
