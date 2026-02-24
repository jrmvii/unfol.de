// Copyright (c) 2026 Jérémy Vtipil
// Licensed under the GNU Affero General Public License v3.0

"use client";

import { useEffect, useRef, useState, useCallback } from "react";

type Brightness = "dark" | "light" | "mid";

/**
 * Linearize an sRGB channel (0–255) for WCAG luminance calculation.
 */
function linearize(c: number): number {
  const s = c / 255;
  return s <= 0.04045 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
}

/**
 * WCAG relative luminance from RGB values.
 */
function luminance(r: number, g: number, b: number): number {
  return 0.2126 * linearize(r) + 0.7152 * linearize(g) + 0.0722 * linearize(b);
}

/**
 * Compute the intersection rectangle of two DOMRects.
 * Returns null if they don't overlap.
 */
function intersectRects(a: DOMRect, b: DOMRect) {
  const x = Math.max(a.left, b.left);
  const y = Math.max(a.top, b.top);
  const right = Math.min(a.right, b.right);
  const bottom = Math.min(a.bottom, b.bottom);
  if (right <= x || bottom <= y) return null;
  return { x, y, width: right - x, height: bottom - y };
}

const SAMPLE_SIZE = 20;
const LIGHT_THRESHOLD = 0.6;
const DARK_THRESHOLD = 0.3;

/**
 * Hook that samples background image brightness behind each overlay ref.
 * Returns a record of brightness classifications per key.
 *
 * Usage:
 *   const brightness = useBackgroundCheck({ home: homeRef, nav: navRef });
 *   // brightness.home === "dark" | "light" | "mid"
 */
export function useBackgroundCheck(
  refs: Record<string, React.RefObject<HTMLElement | null>>,
  pathname?: string
): Record<string, Brightness> {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
  const rafRef = useRef(0);
  const [result, setResult] = useState<Record<string, Brightness>>({});

  const check = useCallback(() => {
    if (!canvasRef.current) {
      canvasRef.current = document.createElement("canvas");
      canvasRef.current.width = SAMPLE_SIZE;
      canvasRef.current.height = SAMPLE_SIZE;
      ctxRef.current = canvasRef.current.getContext("2d", {
        willReadFrequently: true,
      });
    }

    const ctx = ctxRef.current;
    if (!ctx) return;

    // Collect all loaded images from <main>
    const main = document.querySelector("main");
    if (!main) return;
    const imgs = Array.from(main.querySelectorAll("img")).filter(
      (img) => img.complete && img.naturalWidth > 0
    );

    const next: Record<string, Brightness> = {};

    for (const [key, ref] of Object.entries(refs)) {
      const el = ref.current;
      if (!el) continue;

      const overlayRect = el.getBoundingClientRect();
      let totalLuminance = 0;
      let sampleCount = 0;

      for (const img of imgs) {
        const imgRect = img.getBoundingClientRect();
        const inter = intersectRects(overlayRect, imgRect);
        if (!inter) continue;

        // Map intersection back to image natural coordinates
        const scaleX = img.naturalWidth / imgRect.width;
        const scaleY = img.naturalHeight / imgRect.height;
        const sx = (inter.x - imgRect.left) * scaleX;
        const sy = (inter.y - imgRect.top) * scaleY;
        const sw = inter.width * scaleX;
        const sh = inter.height * scaleY;

        // Draw the overlapping region to our small canvas (auto-downscaled)
        ctx.clearRect(0, 0, SAMPLE_SIZE, SAMPLE_SIZE);
        try {
          ctx.drawImage(img, sx, sy, sw, sh, 0, 0, SAMPLE_SIZE, SAMPLE_SIZE);
        } catch {
          continue; // CORS or tainted canvas — skip
        }

        let data: ImageData;
        try {
          data = ctx.getImageData(0, 0, SAMPLE_SIZE, SAMPLE_SIZE);
        } catch {
          continue;
        }

        const pixels = data.data;
        for (let i = 0; i < pixels.length; i += 4) {
          totalLuminance += luminance(pixels[i], pixels[i + 1], pixels[i + 2]);
          sampleCount++;
        }
      }

      if (sampleCount === 0) {
        // No image behind this overlay — no override
        next[key] = "mid";
      } else {
        const avg = totalLuminance / sampleCount;
        if (avg > LIGHT_THRESHOLD) next[key] = "light";
        else if (avg < DARK_THRESHOLD) next[key] = "dark";
        else next[key] = "mid";
      }
    }

    setResult((prev) => {
      // Only update if something changed (avoid re-renders)
      for (const k in next) {
        if (prev[k] !== next[k]) return next;
      }
      return prev;
    });
  }, [refs]);

  useEffect(() => {
    function onScroll() {
      if (rafRef.current) return; // Already scheduled
      rafRef.current = requestAnimationFrame(() => {
        rafRef.current = 0;
        check();
      });
    }

    // Re-check on mount + route change (images may still be loading)
    const t1 = setTimeout(check, 100);
    const t2 = setTimeout(check, 600); // catch lazy-loaded images

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [check, pathname]);

  return result;
}
