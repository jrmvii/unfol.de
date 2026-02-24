// Copyright (c) 2026 Jérémy Vtipil
// Licensed under the GNU Affero General Public License v3.0

import { useState } from "react";
import { Upload, Check, ExternalLink } from "lucide-react";
import { useToast } from "@/components/ui/toast";
import { apiCall } from "@/lib/api-client";
import type { FontSource } from "@/lib/schemas";
import type { SectionProps } from "./types";

const SYSTEM_FONTS = [
  { value: "system-ui", label: "System default" },
  { value: "sans-serif", label: "Sans-serif" },
  { value: "serif", label: "Serif" },
  { value: "monospace", label: "Monospace" },
];

export function BrandingSection({ form, update }: SectionProps) {
  const { toast } = useToast();
  const [uploading, setUploading] = useState<string | null>(null);
  const [uploaded, setUploaded] = useState<Record<string, boolean>>({});

  async function handleFontUpload(weight: "regular" | "bold", file: File) {
    setUploading(weight);
    const fd = new FormData();
    fd.set("weight", weight);
    fd.set("file", file);
    const { error } = await apiCall("/api/tenant/fonts", {
      method: "POST",
      body: fd,
    });
    if (error) {
      toast(error, "error");
    } else {
      toast(`${weight} font uploaded`);
      setUploaded((prev) => ({ ...prev, [weight]: true }));
    }
    setUploading(null);
  }

  return (
    <section className="space-y-4">
      <h2 className="text-sm font-medium text-gray-900 uppercase tracking-wider">
        Branding
      </h2>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs text-gray-500 mb-1">
            Primary color
          </label>
          <input
            type="color"
            value={form.primaryColor}
            onChange={(e) => update("primaryColor", e.target.value)}
            className="w-full h-10 border border-gray-300 rounded cursor-pointer"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">
            Background color
          </label>
          <input
            type="color"
            value={form.bgColor}
            onChange={(e) => update("bgColor", e.target.value)}
            className="w-full h-10 border border-gray-300 rounded cursor-pointer"
          />
        </div>
      </div>

      {/* Font source selector */}
      <div>
        <label className="block text-xs text-gray-500 mb-1">Font source</label>
        <select
          value={form.fontSource}
          onChange={(e) => {
            const source = e.target.value as FontSource;
            update("fontSource", source);
            if (source === "system") update("fontFamily", "system-ui");
            if (source === "google") update("fontFamily", "");
            if (source === "custom") update("fontFamily", "");
          }}
          className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
        >
          <option value="system">System font</option>
          <option value="google">Google Font</option>
          <option value="custom">Custom upload</option>
        </select>
      </div>

      {/* System font picker */}
      {form.fontSource === "system" && (
        <div>
          <label className="block text-xs text-gray-500 mb-1">
            Font family
          </label>
          <select
            value={form.fontFamily}
            onChange={(e) => update("fontFamily", e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
          >
            {SYSTEM_FONTS.map((f) => (
              <option key={f.value} value={f.value}>
                {f.label}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Google Font input */}
      {form.fontSource === "google" && (
        <div className="space-y-2">
          <div>
            <label className="block text-xs text-gray-500 mb-1">
              Google Font name
            </label>
            <input
              type="text"
              value={form.fontFamily}
              onChange={(e) => update("fontFamily", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
              placeholder="Inter, Playfair Display, etc."
            />
          </div>
          <a
            href="https://fonts.google.com"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600"
          >
            Browse Google Fonts <ExternalLink size={10} />
          </a>
          {form.fontFamily && (
            <div className="border border-gray-200 rounded p-3 mt-2">
              {/* eslint-disable-next-line @next/next/no-page-custom-font */}
              <link
                rel="stylesheet"
                href={`https://fonts.googleapis.com/css2?family=${encodeURIComponent(form.fontFamily)}:wght@400;700&display=swap`}
              />
              <p
                className="text-sm text-gray-700"
                style={{ fontFamily: `"${form.fontFamily}", sans-serif` }}
              >
                The quick brown fox jumps over the lazy dog
              </p>
              <p
                className="text-sm text-gray-700 font-bold"
                style={{ fontFamily: `"${form.fontFamily}", sans-serif` }}
              >
                The quick brown fox jumps over the lazy dog
              </p>
            </div>
          )}
        </div>
      )}

      {/* Custom font upload */}
      {form.fontSource === "custom" && (
        <div className="space-y-3">
          <div>
            <label className="block text-xs text-gray-500 mb-1">
              Font family name
            </label>
            <input
              type="text"
              value={form.fontFamily}
              onChange={(e) => update("fontFamily", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
              placeholder="My Custom Font"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            {(["regular", "bold"] as const).map((weight) => (
              <label
                key={weight}
                className="flex items-center gap-2 px-3 py-2 border border-dashed border-gray-300 rounded text-sm text-gray-600 hover:border-gray-400 cursor-pointer"
              >
                {uploaded[weight] ? (
                  <Check size={14} className="text-green-600" />
                ) : (
                  <Upload size={14} />
                )}
                <span>
                  {uploading === weight
                    ? "Uploading..."
                    : `${weight}.woff2`}
                </span>
                <input
                  type="file"
                  accept=".woff2"
                  className="hidden"
                  disabled={uploading !== null}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFontUpload(weight, file);
                    e.target.value = "";
                  }}
                />
              </label>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
