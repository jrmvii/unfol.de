// Copyright (c) 2026 Jérémy Vtipil
// Licensed under the GNU Affero General Public License v3.0

import type { MetadataRoute } from "next";
import { ROOT_DOMAINS } from "@/lib/constants";

export default function robots(): MetadataRoute.Robots {
  const rootDomain = ROOT_DOMAINS[0] || "unfol.de";
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin/", "/platform/", "/api/"],
      },
    ],
    sitemap: `https://${rootDomain}/sitemap.xml`,
  };
}
