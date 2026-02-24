// Copyright (c) 2026 Jérémy Vtipil
// Licensed under the GNU Affero General Public License v3.0

import { OVERLAY_POSITIONS, OVERLAY_ANIMATIONS } from "@/lib/schemas";
import type { OverlayPosition, OverlayAnimation } from "@/lib/schemas";
import type { SectionProps, SettingsFormState } from "./types";

function positionLabel(pos: string): string {
  return pos.split("-").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
}

export function OverlaySection({
  form,
  update,
  setForm,
  pages = [],
}: SectionProps & { pages?: { id: string; title: string }[] }) {
  return (
    <section className="space-y-4">
      <h2 className="text-sm font-medium text-gray-900 uppercase tracking-wider">
        Overlay positions
      </h2>
      <div className="grid grid-cols-2 gap-4">
        {([
          { field: "homePosition" as const, label: "Home anchor" },
          { field: "navPosition" as const, label: "Navigation" },
          { field: "titlePosition" as const, label: "Category title" },
          { field: "aboutPosition" as const, label: "About link" },
        ] satisfies { field: keyof SettingsFormState; label: string }[]).map(({ field, label }) => (
          <div key={field}>
            <label className="block text-xs text-gray-500 mb-1">{label}</label>
            <select
              value={form[field]}
              onChange={(e) => update(field, e.target.value as OverlayPosition)}
              className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 bg-white"
            >
              {OVERLAY_POSITIONS.map((pos) => (
                <option key={pos} value={pos}>
                  {positionLabel(pos)}
                </option>
              ))}
            </select>
          </div>
        ))}
      </div>
      <div>
        <label className="block text-xs text-gray-500 mb-1">About page</label>
        <select
          value={form.aboutPageId}
          onChange={(e) => update("aboutPageId", e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 bg-white"
        >
          <option value="">None</option>
          {pages.map((p) => (
            <option key={p.id} value={p.id}>
              {p.title}
            </option>
          ))}
        </select>
        <p className="text-xs text-gray-400 mt-1">
          Select which page the About overlay link points to
        </p>
      </div>
      <div>
        <label className="block text-xs text-gray-500 mb-1">Overlay animation</label>
        <select
          value={form.overlayAnimation}
          onChange={(e) => update("overlayAnimation", e.target.value as OverlayAnimation)}
          className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 bg-white"
        >
          {OVERLAY_ANIMATIONS.map((anim) => (
            <option key={anim} value={anim}>
              {anim.charAt(0).toUpperCase() + anim.slice(1)}
            </option>
          ))}
        </select>
      </div>
      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={form.navAutoExpand}
          onChange={(e) =>
            setForm((prev) => ({ ...prev, navAutoExpand: e.target.checked }))
          }
          className="rounded border-gray-300"
        />
        <span className="text-sm text-gray-700">
          Auto-expand navigation after slide-in
        </span>
      </label>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs text-gray-500 mb-1">Navigation label</label>
          <input
            type="text"
            value={form.navLabel}
            onChange={(e) => update("navLabel", e.target.value)}
            placeholder="Projects"
            className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">About label</label>
          <input
            type="text"
            value={form.aboutLabel}
            onChange={(e) => update("aboutLabel", e.target.value)}
            placeholder="About"
            className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
          />
        </div>
      </div>
    </section>
  );
}
