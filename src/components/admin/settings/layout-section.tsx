// Copyright (c) 2026 Jérémy Vtipil
// Licensed under the GNU Affero General Public License v3.0

import type { PortfolioLayout, TransitionStyle } from "@/lib/schemas";
import type { SectionProps } from "./types";

export function LayoutSection({
  form,
  update,
  setForm,
  pages = [],
}: SectionProps & { pages?: { id: string; title: string }[] }) {
  return (
    <section className="space-y-4">
      <h2 className="text-sm font-medium text-gray-900 uppercase tracking-wider">
        Portfolio layout
      </h2>
      <div className="flex gap-4">
        {[
          { value: "standard", label: "Standard", desc: "Centered, max 896px" },
          { value: "fullscreen", label: "Fullscreen", desc: "Edge-to-edge, full width" },
        ].map((opt) => (
          <label
            key={opt.value}
            className={`flex-1 p-3 border rounded cursor-pointer transition-colors ${
              form.portfolioLayout === opt.value
                ? "border-gray-900 bg-gray-50"
                : "border-gray-200 hover:border-gray-300"
            }`}
          >
            <input
              type="radio"
              name="portfolioLayout"
              value={opt.value}
              checked={form.portfolioLayout === opt.value}
              onChange={(e) => update("portfolioLayout", e.target.value as PortfolioLayout)}
              className="sr-only"
            />
            <p className="text-sm font-medium text-gray-900">{opt.label}</p>
            <p className="text-xs text-gray-500">{opt.desc}</p>
          </label>
        ))}
      </div>
      <div className="flex gap-4">
        {[
          { value: "slide-up", label: "Slide up", desc: "Fade in + slide up" },
          { value: "crossfade", label: "Crossfade", desc: "Fade in only" },
        ].map((opt) => (
          <label
            key={opt.value}
            className={`flex-1 p-3 border rounded cursor-pointer transition-colors ${
              form.transitionStyle === opt.value
                ? "border-gray-900 bg-gray-50"
                : "border-gray-200 hover:border-gray-300"
            }`}
          >
            <input
              type="radio"
              name="transitionStyle"
              value={opt.value}
              checked={form.transitionStyle === opt.value}
              onChange={(e) => update("transitionStyle", e.target.value as TransitionStyle)}
              className="sr-only"
            />
            <p className="text-sm font-medium text-gray-900">{opt.label}</p>
            <p className="text-xs text-gray-500">{opt.desc}</p>
          </label>
        ))}
      </div>
      <div>
        <label className="block text-xs text-gray-500 mb-1">
          Hero duration (seconds)
        </label>
        <input
          type="number"
          min={0}
          max={30}
          value={form.heroDuration}
          onChange={(e) =>
            setForm((prev) => ({
              ...prev,
              heroDuration: parseInt(e.target.value) || 0,
            }))
          }
          className="w-24 px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
        />
        <p className="text-xs text-gray-400 mt-1">
          0 = disabled. Shows only the hero for this duration before revealing the rest of the page.
        </p>
      </div>
      <div>
        <label className="block text-xs text-gray-500 mb-1">Homepage</label>
        <select
          value={form.homePageId}
          onChange={(e) => update("homePageId", e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 bg-white"
        >
          <option value="">Par défaut (grille catégories)</option>
          {pages.map((p) => (
            <option key={p.id} value={p.id}>
              {p.title}
            </option>
          ))}
        </select>
        <p className="text-xs text-gray-400 mt-1">
          Select a page to display on the homepage after the hero animation.
        </p>
      </div>
    </section>
  );
}
