// Copyright (c) 2026 Jérémy Vtipil
// Licensed under the GNU Affero General Public License v3.0

export function VideoPlayer({
  src,
  layout = "standard",
}: {
  src: string;
  layout?: "standard" | "fullscreen";
}) {
  const isFullscreen = layout === "fullscreen";

  return (
    <div className={isFullscreen ? "w-full" : "max-w-4xl mx-auto px-4 mb-8"}>
      <video
        src={src}
        autoPlay
        muted
        loop
        playsInline
        className="w-full h-auto block"
      />
    </div>
  );
}
