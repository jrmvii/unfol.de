// Copyright (c) 2026 Jérémy Vtipil
// Licensed under the GNU Affero General Public License v3.0

"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

interface TrackerProps {
  pageType: "home" | "category" | "project" | "page";
  resourceId?: string;
}

export function AnalyticsTracker({ pageType, resourceId }: TrackerProps) {
  const pathname = usePathname();
  const lastTracked = useRef("");

  useEffect(() => {
    const key = `${pathname}:${pageType}:${resourceId || ""}`;
    if (lastTracked.current === key) return;
    lastTracked.current = key;

    const payload = JSON.stringify({
      path: pathname,
      pageType,
      resourceId,
      referrer: document.referrer || undefined,
    });

    if (navigator.sendBeacon) {
      navigator.sendBeacon(
        "/api/analytics/track",
        new Blob([payload], { type: "application/json" })
      );
    } else {
      fetch("/api/analytics/track", {
        method: "POST",
        body: payload,
        headers: { "Content-Type": "application/json" },
        keepalive: true,
      }).catch(() => {});
    }
  }, [pathname, pageType, resourceId]);

  return null;
}
