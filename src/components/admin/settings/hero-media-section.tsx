// Copyright (c) 2026 Jérémy Vtipil
// Licensed under the GNU Affero General Public License v3.0

"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/toast";
import { apiJson, apiCall } from "@/lib/api-client";
import { VIDEO_EXTS, YT_RE, mediaUrl } from "@/lib/media-utils";
import { Upload, X } from "lucide-react";

export function HeroMediaSection({ initialLogoUrl }: { initialLogoUrl: string }) {
  const router = useRouter();
  const { toast } = useToast();
  const logoInputRef = useRef<HTMLInputElement>(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [logoUrl, setLogoUrl] = useState(initialLogoUrl);

  async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingLogo(true);

    const formData = new FormData();
    formData.set("file", file);

    const { data, error } = await apiCall<{ logoUrl: string }>("/api/tenant/logo", {
      method: "POST",
      body: formData,
    });

    if (!error && data) {
      setLogoUrl(data.logoUrl);
      toast("Logo updated");
      router.refresh();
    } else {
      toast(error || "Failed to upload logo", "error");
    }

    setUploadingLogo(false);
    if (logoInputRef.current) logoInputRef.current.value = "";
  }

  async function saveLogo(url: string) {
    const { error } = await apiJson("/api/tenant", "PUT", { logoUrl: url });
    if (error) toast(error, "error");
    router.refresh();
  }

  return (
    <section className="space-y-4">
      <h2 className="text-sm font-medium text-gray-900 uppercase tracking-wider">
        Hero media
      </h2>
      <div className="space-y-3">
        {logoUrl && YT_RE.test(logoUrl) ? (
          <img
            src={`https://img.youtube.com/vi/${logoUrl.match(YT_RE)?.[1]}/hqdefault.jpg`}
            alt="YouTube thumbnail"
            className="h-24 rounded object-cover"
          />
        ) : logoUrl && VIDEO_EXTS.test(logoUrl) ? (
          <video
            src={mediaUrl(logoUrl)}
            muted
            className="h-24 rounded"
          />
        ) : logoUrl ? (
          <img
            src={mediaUrl(logoUrl)}
            alt="Logo"
            className="h-12 max-w-[200px] object-contain bg-gray-50 rounded p-1"
          />
        ) : (
          <div className="h-12 w-32 bg-gray-100 rounded flex items-center justify-center text-xs text-gray-400">
            No media
          </div>
        )}

        <div>
          <label className="block text-xs text-gray-500 mb-1">YouTube URL</label>
          <div className="flex gap-2">
            <input
              type="url"
              value={logoUrl.startsWith("http") ? logoUrl : ""}
              onChange={(e) => setLogoUrl(e.target.value)}
              onBlur={async () => {
                if (logoUrl.startsWith("http")) {
                  await saveLogo(logoUrl);
                  toast("Hero media updated");
                }
              }}
              placeholder="https://youtube.com/watch?v=..."
              className="flex-1 px-3 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
            />
            {logoUrl && (
              <button
                type="button"
                onClick={async () => {
                  setLogoUrl("");
                  await saveLogo("");
                  toast("Hero media cleared");
                }}
                className="px-2 py-1.5 border border-gray-300 rounded text-gray-500 hover:bg-gray-50"
                title="Clear"
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400">ou</span>
          <label className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-300 rounded text-sm text-gray-700 hover:bg-gray-50 cursor-pointer">
            <Upload size={14} />
            {uploadingLogo ? "Uploading..." : "Upload fichier"}
            <input
              ref={logoInputRef}
              type="file"
              accept="image/*,video/mp4,video/webm"
              onChange={handleLogoUpload}
              className="hidden"
              disabled={uploadingLogo}
            />
          </label>
        </div>
      </div>
    </section>
  );
}
