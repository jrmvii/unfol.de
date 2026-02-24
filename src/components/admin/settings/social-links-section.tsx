// Copyright (c) 2026 Jérémy Vtipil
// Licensed under the GNU Affero General Public License v3.0

import type { SectionProps } from "./types";

const SOCIAL_FIELDS = [
  { field: "instagramUrl", label: "Instagram URL" },
  { field: "behanceUrl", label: "Behance URL" },
  { field: "linkedinUrl", label: "LinkedIn URL" },
  { field: "websiteUrl", label: "Website URL" },
] as const;

export function SocialLinksSection({ form, update }: SectionProps) {
  return (
    <section className="space-y-4">
      <h2 className="text-sm font-medium text-gray-900 uppercase tracking-wider">
        Social links
      </h2>
      {SOCIAL_FIELDS.map(({ field, label }) => (
        <div key={field}>
          <label className="block text-xs text-gray-500 mb-1">{label}</label>
          <input
            type="url"
            value={form[field as keyof typeof form] as string}
            onChange={(e) => update(field, e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
            placeholder="https://..."
          />
        </div>
      ))}
    </section>
  );
}
