// Copyright (c) 2026 Jérémy Vtipil
// Licensed under the GNU Affero General Public License v3.0

import type { SectionProps } from "./types";

export function GeneralSection({
  form,
  update,
  canUseDomain = false,
}: SectionProps & { canUseDomain?: boolean }) {
  return (
    <section className="space-y-4">
      <h2 className="text-sm font-medium text-gray-900 uppercase tracking-wider">
        General
      </h2>
      <div>
        <label className="block text-xs text-gray-500 mb-1">Site name</label>
        <input
          type="text"
          value={form.name}
          onChange={(e) => update("name", e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
        />
      </div>
      <div>
        <label className="block text-xs text-gray-500 mb-1">Bio</label>
        <textarea
          value={form.bio}
          onChange={(e) => update("bio", e.target.value)}
          rows={4}
          className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 resize-vertical"
        />
      </div>
      <div>
        <label className="block text-xs text-gray-500 mb-1">Contact email</label>
        <input
          type="email"
          value={form.email}
          onChange={(e) => update("email", e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
        />
      </div>
      <div>
        <label className="block text-xs text-gray-500 mb-1">Custom domain</label>
        {canUseDomain ? (
          <>
            <input
              type="text"
              value={form.domain}
              onChange={(e) => update("domain", e.target.value.toLowerCase())}
              placeholder="monsite.com"
              className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
            />
            <div className="mt-2 p-3 bg-gray-50 rounded border border-gray-200">
              <p className="text-xs text-gray-600 font-medium mb-1">
                DNS configuration
              </p>
              <p className="text-xs text-gray-500">
                Add a <code className="bg-gray-100 px-1 rounded">CNAME</code>{" "}
                record pointing to{" "}
                <code className="bg-gray-100 px-1 rounded">unfol.de</code>
              </p>
              <div className="mt-1 text-xs text-gray-400 font-mono bg-white px-2 py-1 rounded border border-gray-200">
                {form.domain || "monsite.com"} CNAME unfol.de
              </div>
            </div>
          </>
        ) : (
          <div className="p-3 bg-gray-50 rounded border border-gray-200">
            <p className="text-sm text-gray-500">
              Custom domains are available on the Pro plan.
            </p>
            <a
              href="/admin/billing"
              className="text-sm text-gray-900 underline hover:no-underline"
            >
              Upgrade to Pro
            </a>
          </div>
        )}
      </div>
    </section>
  );
}
