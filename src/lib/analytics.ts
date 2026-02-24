// Copyright (c) 2026 Jérémy Vtipil
// Licensed under the GNU Affero General Public License v3.0

import { createHash } from "crypto";

const ANALYTICS_SALT = process.env.ANALYTICS_SALT || "unfolde-analytics-v1";

const BOT_PATTERN = /bot|crawler|spider|headless|scraper|wget|curl/i;

/**
 * Daily-rotating visitor hash from IP + User-Agent.
 * Privacy-friendly: not reversible, rotates daily, no cookies.
 */
export function visitorHash(ip: string, userAgent: string): string {
  const date = new Date().toISOString().slice(0, 10);
  return createHash("sha256")
    .update(`${ip}|${userAgent}|${date}|${ANALYTICS_SALT}`)
    .digest("hex")
    .slice(0, 16);
}

/**
 * Clean a referrer URL into a readable source name.
 */
export function cleanReferrer(referrer: string | null | undefined): string {
  if (!referrer) return "direct";
  try {
    const hostname = new URL(referrer).hostname.replace(/^www\./, "");
    if (hostname.includes("google")) return "google";
    if (hostname.includes("instagram")) return "instagram";
    if (hostname.includes("facebook") || hostname.includes("fb.com")) return "facebook";
    if (hostname.includes("twitter") || hostname.includes("x.com")) return "twitter";
    if (hostname.includes("linkedin")) return "linkedin";
    if (hostname.includes("pinterest")) return "pinterest";
    if (hostname.includes("behance")) return "behance";
    return hostname;
  } catch {
    return "direct";
  }
}

/**
 * Convert a period string to a Date cutoff.
 */
export function periodToDate(period: "7d" | "30d" | "90d"): Date {
  const days = { "7d": 7, "30d": 30, "90d": 90 }[period];
  const d = new Date();
  d.setDate(d.getDate() - days);
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * Check if a User-Agent looks like a bot.
 */
export function isBot(userAgent: string): boolean {
  return BOT_PATTERN.test(userAgent);
}

/**
 * Fire-and-forget forwarding to Umami (if configured).
 */
export function forwardToUmami(
  path: string,
  referrer: string | undefined,
  userAgent: string,
  hostname: string
): void {
  const umamiUrl = process.env.UMAMI_URL;
  const websiteId = process.env.UMAMI_WEBSITE_ID;
  if (!umamiUrl || !websiteId) return;

  fetch(`${umamiUrl}/api/send`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "User-Agent": userAgent,
    },
    body: JSON.stringify({
      type: "event",
      payload: {
        website: websiteId,
        url: path,
        referrer: referrer || "",
        hostname,
      },
    }),
  }).catch((err) => {
    console.debug("umami_forward_failed", String(err));
  });
}
