// Copyright (c) 2026 Jérémy Vtipil
// Licensed under the GNU Affero General Public License v3.0

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useRef, useEffect, useMemo, ViewTransition } from "react";
import type { Tenant, Category } from "@prisma/client";
import type { OverlayPosition } from "@/lib/schemas";
import { safePosition } from "@/lib/schemas";
import { OVERLAY_SLIDE_MS, HERO_FADEOUT_MS, COLOR_TRANSITION } from "@/lib/constants";
import { useBackgroundCheck } from "@/hooks/use-background-check";

const positionClasses: Record<Exclude<OverlayPosition, "hidden">, string> = {
  "top-left": "fixed top-0 left-0 z-50 p-6",
  "top-right": "fixed top-0 right-0 z-50 p-6 text-right",
  "bottom-left": "fixed bottom-0 left-0 z-50 p-6",
  "bottom-right": "fixed bottom-0 right-0 z-50 p-6 text-right",
};

/** Inline style using the adaptive overlay color with fallback to --primary */
const overlayColor = {
  color: "var(--overlay-color, var(--primary))",
  transition: `color ${COLOR_TRANSITION}`,
} as React.CSSProperties;

function SlideIn({
  children,
  position,
}: {
  children: React.ReactNode;
  position: OverlayPosition;
}) {
  const isBottom = position === "bottom-left" || position === "bottom-right";

  return (
    <div
      style={{
        animation: `${isBottom ? "slide-in-bottom" : "slide-in-top"} ${OVERLAY_SLIDE_MS}ms ease-in-out both`,
      }}
    >
      {children}
    </div>
  );
}

function CategoryList({ categories }: { categories: Category[] }) {
  const pathname = usePathname();
  return (
    <>
      {categories.map((cat) => {
        const isActive = pathname === `/${cat.slug}`;
        return (
          <li key={cat.id}>
            <Link
              href={`/${cat.slug}`}
              className={`text-base no-underline ${
                isActive ? "opacity-100" : "opacity-60 hover:opacity-100"
              }`}
              style={{
                color: "var(--overlay-color, var(--primary))",
                transition: `color ${COLOR_TRANSITION}, opacity ${COLOR_TRANSITION}`,
              }}
            >
              {cat.name}
            </Link>
          </li>
        );
      })}
    </>
  );
}

function SlideList({
  categories,
  open,
}: {
  categories: Category[];
  open: boolean;
}) {
  const listRef = useRef<HTMLUListElement>(null);
  const [measuredHeight, setMeasuredHeight] = useState(0);

  useEffect(() => {
    if (listRef.current) {
      setMeasuredHeight(listRef.current.scrollHeight);
    }
  }, [categories]);

  const measured = measuredHeight > 0;

  return (
    <div className="overflow-hidden">
      <ul
        ref={listRef}
        className="ps-4 pt-2 space-y-1"
        style={{
          listStyleType: '"- "',
          color: "var(--overlay-color, var(--primary))",
          transition: measured
            ? `color ${COLOR_TRANSITION}, margin-top ${OVERLAY_SLIDE_MS}ms ease-in-out`
            : `color ${COLOR_TRANSITION}`,
          marginTop: open ? 0 : measured ? -measuredHeight : -9999,
        }}
      >
        <CategoryList categories={categories} />
      </ul>
    </div>
  );
}

function NavDropdown({
  categories,
  position,
  animation = "fade",
  autoExpand = false,
  label = "Projects",
}: {
  categories: Category[];
  position: OverlayPosition;
  animation?: string;
  autoExpand?: boolean;
  label?: string;
}) {
  const [open, setOpen] = useState(false);
  const isBottom = position === "bottom-left" || position === "bottom-right";
  const isSlide = animation === "slide";

  useEffect(() => {
    if (!autoExpand || !isSlide) return;
    const timer = setTimeout(() => setOpen(true), OVERLAY_SLIDE_MS);
    return () => clearTimeout(timer);
  }, [autoExpand, isSlide]);

  const listEl = (placement: "before" | "after") => {
    if (isSlide) {
      return <SlideList categories={categories} open={open} />;
    }

    // Fade (default): max-height + opacity
    return (
      <ul
        className={`ps-4 ${placement === "before" ? "mb-2" : "mt-2"} space-y-1 transition-all duration-300 overflow-hidden ${
          open ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
        }`}
        style={{ listStyleType: '"- "', color: "var(--overlay-color, var(--primary))" }}
      >
        <CategoryList categories={categories} />
      </ul>
    );
  };

  return (
    <div>
      {isBottom && listEl("before")}

      <button
        onClick={() => setOpen(!open)}
        className="text-[28px] font-bold leading-tight bg-transparent border-0 cursor-pointer"
        style={overlayColor}
      >
        {label}
      </button>

      {!isBottom && listEl("after")}
    </div>
  );
}

export function OverlayUI({
  tenant,
  categories,
  aboutSlug,
}: {
  tenant: Tenant;
  categories: Category[];
  aboutSlug?: string;
}) {
  const pathname = usePathname();
  const isHome = pathname === "/";
  const heroDuration = tenant.heroDuration || 0;
  const [heroWaiting, setHeroWaiting] = useState(isHome && heroDuration > 0);

  useEffect(() => {
    if (!isHome || heroDuration <= 0) {
      setHeroWaiting(false); // eslint-disable-line react-hooks/set-state-in-effect -- sync with route change
      return;
    }
    // Wait for entering phase + leaving fade-out
    const timer = setTimeout(() => setHeroWaiting(false), heroDuration * 1000 + HERO_FADEOUT_MS);
    return () => clearTimeout(timer);
  }, [isHome, heroDuration]);

  const homePos = safePosition(tenant.homePosition, "top-left");
  const navPos = safePosition(tenant.navPosition, "top-right");
  const titlePos = safePosition(tenant.titlePosition);
  const aboutPos = safePosition(tenant.aboutPosition);
  const isSlide = tenant.overlayAnimation === "slide";
  const isTitleTop = titlePos === "top-left" || titlePos === "top-right";
  const titleAnim = isTitleTop ? "cat-slide-top" : "cat-slide-btm";

  const currentCategory = categories.find((c) => pathname === `/${c.slug}`);

  // Refs for background brightness detection
  const homeRef = useRef<HTMLDivElement>(null);
  const navRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLDivElement>(null);
  const aboutRef = useRef<HTMLDivElement>(null);

  const bgRefs = useMemo(
    () => ({ home: homeRef, nav: navRef, title: titleRef, about: aboutRef }),
    []
  );
  const brightness = useBackgroundCheck(bgRefs, pathname);

  // Don't render overlays until hero waiting phase is over
  if (heroWaiting) return null;

  const wrap = (pos: OverlayPosition, el: React.ReactNode) =>
    isSlide ? <SlideIn position={pos}>{el}</SlideIn> : el;

  return (
    <>
      {homePos !== "hidden" && (
        <div
          ref={homeRef}
          className={positionClasses[homePos]}
          data-brightness={brightness.home}
        >
          {wrap(
            homePos,
            <Link
              href="/"
              className="text-xl font-bold no-underline"
              style={overlayColor}
            >
              {tenant.name}
            </Link>
          )}
        </div>
      )}

      {navPos !== "hidden" && (
        <div
          ref={navRef}
          className={positionClasses[navPos]}
          data-brightness={brightness.nav}
        >
          {wrap(
            navPos,
            <NavDropdown categories={categories} position={navPos} animation={tenant.overlayAnimation} autoExpand={tenant.navAutoExpand} label={tenant.navLabel} />
          )}
        </div>
      )}

      {titlePos !== "hidden" && currentCategory && (
        <div
          ref={titleRef}
          className={`${positionClasses[titlePos]} inset-x-0 pointer-events-none`}
          data-brightness={brightness.title}
        >
          {wrap(
            titlePos,
            <ViewTransition enter={titleAnim} exit={titleAnim} update={titleAnim}>
              <h1
                className="text-[32px] font-bold leading-tight m-0 w-full"
                style={overlayColor}
              >
                {currentCategory.name}
              </h1>
            </ViewTransition>
          )}
        </div>
      )}

      {aboutPos !== "hidden" && aboutSlug && (
        <div
          ref={aboutRef}
          className={positionClasses[aboutPos]}
          data-brightness={brightness.about}
        >
          {wrap(
            aboutPos,
            <Link
              href={`/${aboutSlug}`}
              className="text-xl font-bold no-underline"
              style={overlayColor}
            >
              {tenant.aboutLabel}
            </Link>
          )}
        </div>
      )}
    </>
  );
}
