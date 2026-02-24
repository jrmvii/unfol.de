// Copyright (c) 2026 Jérémy Vtipil
// Licensed under the GNU Affero General Public License v3.0

"use client";

import { useCallback, useEffect, useState } from "react";

export type Period = "7d" | "30d" | "90d";

export const PERIODS: { value: Period; label: string }[] = [
  { value: "7d", label: "7 days" },
  { value: "30d", label: "30 days" },
  { value: "90d", label: "90 days" },
];

export function formatNumber(n: number): string {
  if (n >= 10_000) return `${(n / 1000).toFixed(1)}k`;
  return n.toLocaleString("fr-FR");
}

export function useAnalyticsFetch<T>(url: string) {
  const [period, setPeriod] = useState<Period>("30d");
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(
    async (p: Period) => {
      setLoading(true);
      try {
        const res = await fetch(`${url}?period=${p}`);
        if (res.ok) {
          setData(await res.json());
        }
      } catch (err) {
        console.warn("analytics_fetch_failed", err);
      } finally {
        setLoading(false);
      }
    },
    [url]
  );

  useEffect(() => {
    fetchData(period);
  }, [period, fetchData]);

  return { period, setPeriod, data, loading };
}
