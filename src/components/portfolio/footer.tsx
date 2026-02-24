// Copyright (c) 2026 Jérémy Vtipil
// Licensed under the GNU Affero General Public License v3.0

import type { Tenant } from "@prisma/client";

export function Footer({ tenant, showBranding = true }: { tenant: Tenant; showBranding?: boolean }) {
  const socials = [
    { url: tenant.instagramUrl, label: "Instagram" },
    { url: tenant.behanceUrl, label: "Behance" },
    { url: tenant.linkedinUrl, label: "LinkedIn" },
    { url: tenant.websiteUrl, label: "Website" },
  ].filter((s) => s.url);

  return (
    <footer className="py-12 px-6 text-center">
      {tenant.email && (
        <a
          href={`mailto:${tenant.email}`}
          className="text-sm no-underline mb-4 block"
          style={{ color: "var(--primary)" }}
        >
          {tenant.email}
        </a>
      )}
      {socials.length > 0 && (
        <div className="flex justify-center gap-6">
          {socials.map((s) => (
            <a
              key={s.label}
              href={s.url!}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs uppercase tracking-wider no-underline opacity-60 hover:opacity-100 transition-opacity"
              style={{ color: "var(--primary)" }}
            >
              {s.label}
            </a>
          ))}
        </div>
      )}
      {showBranding && (
        <div className="mt-8">
          <a
            href="https://unfol.de"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[10px] uppercase tracking-[0.2em] no-underline opacity-20 hover:opacity-50 transition-opacity"
            style={{ color: "var(--primary)" }}
          >
            Powered by unfol.de
          </a>
        </div>
      )}
    </footer>
  );
}
