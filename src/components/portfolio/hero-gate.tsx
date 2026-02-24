// Copyright (c) 2026 Jérémy Vtipil
// Licensed under the GNU Affero General Public License v3.0

"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { HERO_FADEOUT_MS } from "@/lib/constants";

type Phase = "entering" | "leaving" | "done" | null;

export function HeroGate({
  duration,
  children,
}: {
  duration: number;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isHome = pathname === "/";
  const [phase, setPhase] = useState<Phase>(
    isHome && duration > 0 ? "entering" : null
  );

  useEffect(() => {
    if (!isHome || duration <= 0) {
      setPhase(null); // eslint-disable-line react-hooks/set-state-in-effect -- sync with route change
      return;
    }

    if (phase === "entering") {
      const timer = setTimeout(() => setPhase("leaving"), duration * 1000);
      return () => clearTimeout(timer);
    }

    if (phase === "leaving") {
      const timer = setTimeout(() => setPhase("done"), HERO_FADEOUT_MS);
      return () => clearTimeout(timer);
    }
  }, [isHome, duration, phase]);

  const isWaiting = phase === "entering" || phase === "leaving";

  return (
    <div
      data-hero-waiting={isWaiting ? "" : undefined}
      data-hero-phase={phase || undefined}
    >
      {children}
    </div>
  );
}
