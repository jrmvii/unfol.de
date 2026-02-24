// Copyright (c) 2026 Jérémy Vtipil
// Licensed under the GNU Affero General Public License v3.0

"use client";

import { useState, useEffect, useCallback, useReducer } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useToast } from "@/components/ui/toast";
import { Spinner } from "@/components/ui/spinner";
import { apiJson, apiCall } from "@/lib/api-client";
import { slugify } from "@/lib/utils";
import { PAGE_TEMPLATES, COLUMN_LAYOUTS, layoutToGridCols, layoutColCount } from "@/lib/schemas";
import type { ColumnBlock } from "@/lib/schemas";
import type { Page, Media } from "@prisma/client";
import { mediaUrl } from "@/lib/media-utils";
import { ImageIcon, Type, ChevronUp, ChevronDown, X } from "lucide-react";

const TEMPLATE_OPTIONS = [
  { value: "text-centered", label: "Centré", desc: "Centré, compact" },
  { value: "text-wide", label: "Large", desc: "Pleine largeur" },
  { value: "text-columns", label: "Colonnes", desc: "Blocs indépendants" },
  { value: "masonry", label: "Masonry", desc: "Grille Pinterest" },
] as const;

type ContentWrapper = { layout: string; blocks: ColumnBlock[] };

function parseMasonryContent(content: string): { mediaIds: string[]; gap: number } {
  try {
    const parsed = JSON.parse(content);
    if (parsed && typeof parsed === "object") {
      return {
        mediaIds: Array.isArray(parsed.mediaIds) ? parsed.mediaIds : [],
        gap: typeof parsed.gap === "number" ? parsed.gap : 8,
      };
    }
  } catch { /* not JSON */ }
  return { mediaIds: [], gap: 8 };
}

function parseContent(content: string, fallbackLayout: string): ContentWrapper {
  try {
    const parsed = JSON.parse(content);
    // New wrapper format
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed) && parsed.blocks) {
      return { layout: parsed.layout || fallbackLayout, blocks: parsed.blocks };
    }
    // Old array format (backward compat)
    if (Array.isArray(parsed)) {
      const colCount = parsed.length;
      const layout = Array(colCount).fill("1").join("-");
      return { layout, blocks: parsed };
    }
  } catch {
    // not JSON
  }
  const colCount = layoutColCount(fallbackLayout);
  return {
    layout: fallbackLayout,
    blocks: Array.from({ length: colCount }, () => ({ type: "text" as const, content: "" })),
  };
}

function syncBlockCount(blocks: ColumnBlock[], count: number): ColumnBlock[] {
  if (blocks.length === count) return blocks;
  if (blocks.length > count) return blocks.slice(0, count);
  return [
    ...blocks,
    ...Array.from({ length: count - blocks.length }, () => ({
      type: "text" as const,
      content: "",
    })),
  ];
}

// ---------------------------------------------------------------------------
// Reducer — consolidates form + template-specific state
// ---------------------------------------------------------------------------

interface EditorState {
  title: string;
  slug: string;
  content: string;
  template: string;
  columns: number;
  showTitle: boolean;
  published: boolean;
  // text-columns
  layout: string;
  blocks: ColumnBlock[];
  // masonry (preserved across template switches for UX)
  masonryIds: string[];
  masonryGap: number;
}

type EditorAction =
  | { type: "SET_FIELD"; field: string; value: string | number | boolean }
  | { type: "SET_TEMPLATE"; template: string }
  | { type: "SET_LAYOUT"; layout: string }
  | { type: "SET_BLOCK"; index: number; block: ColumnBlock }
  | { type: "SET_MASONRY_IDS"; ids: string[] }
  | { type: "SET_MASONRY_GAP"; gap: number };

function editorReducer(state: EditorState, action: EditorAction): EditorState {
  switch (action.type) {
    case "SET_FIELD":
      return { ...state, [action.field]: action.value };
    case "SET_TEMPLATE":
      return { ...state, template: action.template };
    case "SET_LAYOUT": {
      const colCount = layoutColCount(action.layout);
      return {
        ...state,
        layout: action.layout,
        columns: colCount,
        blocks: syncBlockCount(state.blocks, colCount),
      };
    }
    case "SET_BLOCK":
      return {
        ...state,
        blocks: state.blocks.map((b, i) => (i === action.index ? action.block : b)),
      };
    case "SET_MASONRY_IDS":
      return { ...state, masonryIds: action.ids };
    case "SET_MASONRY_GAP":
      return { ...state, masonryGap: action.gap };
  }
}

function initEditorState(page: Page | null): EditorState {
  const colsData = page?.template === "text-columns"
    ? parseContent(page.content, "1-1")
    : { layout: "1-1", blocks: [{ type: "text" as const, content: "" }, { type: "text" as const, content: "" }] };
  const masonryData = page?.template === "masonry"
    ? parseMasonryContent(page.content)
    : { mediaIds: [], gap: 8 };

  return {
    title: page?.title || "",
    slug: page?.slug || "",
    content: page?.content || "",
    template: page?.template || "text-centered",
    columns: page?.columns || 2,
    showTitle: page?.showTitle ?? true,
    published: page?.published ?? true,
    layout: colsData.layout,
    blocks: colsData.blocks,
    masonryIds: masonryData.mediaIds,
    masonryGap: masonryData.gap,
  };
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function PageEditor({ page }: { page: Page | null }) {
  const router = useRouter();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [state, dispatch] = useReducer(editorReducer, page, initEditorState);

  const [allMedia, setAllMedia] = useState<Media[]>([]);
  const [mediaLoaded, setMediaLoaded] = useState(false);

  // Fetch all tenant media when in columns or masonry mode
  useEffect(() => {
    if ((state.template !== "text-columns" && state.template !== "masonry") || mediaLoaded) return;
    apiCall<Media[]>("/api/media").then(({ data }) => {
      if (data) {
        setAllMedia(data);
        setMediaLoaded(true);
      }
    });
  }, [state.template, mediaLoaded]);

  const handleBlock = useCallback((index: number, block: ColumnBlock) => {
    dispatch({ type: "SET_BLOCK", index, block });
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!state.title || !state.slug) {
      toast("Title and slug are required", "error");
      return;
    }

    setSaving(true);

    const payload = {
      title: state.title,
      slug: state.slug,
      template: state.template,
      columns: state.columns,
      showTitle: state.showTitle,
      published: state.published,
      content: state.content,
    };

    if (state.template === "text-columns") {
      payload.content = JSON.stringify({ layout: state.layout, blocks: state.blocks });
      payload.columns = layoutColCount(state.layout);
    } else if (state.template === "masonry") {
      payload.content = JSON.stringify({ mediaIds: state.masonryIds, gap: state.masonryGap });
    }

    const url = page ? `/api/pages/${page.id}` : "/api/pages";
    const method = page ? "PUT" : "POST";

    const { data, error } = await apiJson<{ id: string }>(url, method, payload);

    if (!error) {
      toast(page ? "Page saved" : "Page created");
      if (!page && data) {
        router.push(`/admin/pages/${data.id}`);
      }
      router.refresh();
    } else {
      toast(error, "error");
    }

    setSaving(false);
  }

  const isColumnsMode = state.template === "text-columns";
  const isMasonryMode = state.template === "masonry";

  return (
    <form
      onSubmit={handleSave}
      className="bg-white p-6 rounded-lg shadow-sm space-y-6 max-w-3xl"
    >
      <div>
        <label className="block text-xs text-gray-500 mb-1">Title</label>
        <input
          type="text"
          value={state.title}
          onChange={(e) => {
            dispatch({ type: "SET_FIELD", field: "title", value: e.target.value });
            if (!page) {
              dispatch({ type: "SET_FIELD", field: "slug", value: slugify(e.target.value) });
            }
          }}
          className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
        />
      </div>

      <div>
        <label className="block text-xs text-gray-500 mb-1">Slug</label>
        <input
          type="text"
          value={state.slug}
          onChange={(e) => dispatch({ type: "SET_FIELD", field: "slug", value: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
        />
      </div>

      <div>
        <label className="block text-xs text-gray-500 mb-2">Template</label>
        <div className="flex gap-3">
          {TEMPLATE_OPTIONS.map((opt) => (
            <label
              key={opt.value}
              className={`flex-1 p-3 border rounded cursor-pointer transition-colors ${
                state.template === opt.value
                  ? "border-gray-900 bg-gray-50"
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <input
                type="radio"
                name="template"
                value={opt.value}
                checked={state.template === opt.value}
                onChange={(e) => dispatch({ type: "SET_TEMPLATE", template: e.target.value })}
                className="sr-only"
              />
              <p className="text-sm font-medium text-gray-900">{opt.label}</p>
              <p className="text-xs text-gray-500">{opt.desc}</p>
            </label>
          ))}
        </div>
      </div>

      {isColumnsMode && (
        <div>
          <label className="block text-xs text-gray-500 mb-2">Disposition</label>
          <div className="flex flex-wrap gap-2">
            {COLUMN_LAYOUTS.map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => dispatch({ type: "SET_LAYOUT", layout: preset })}
                className={`flex gap-0.5 items-stretch h-8 w-20 p-1.5 border rounded transition-colors ${
                  state.layout === preset
                    ? "border-gray-900 bg-gray-50"
                    : "border-gray-200 hover:border-gray-400"
                }`}
                title={preset.split("-").map((n) => `${n}fr`).join(" ")}
              >
                {preset.split("-").map((n, i) => (
                  <div
                    key={i}
                    style={{ flex: Number(n) }}
                    className={`rounded-sm ${
                      state.layout === preset ? "bg-gray-900" : "bg-gray-300"
                    }`}
                  />
                ))}
              </button>
            ))}
          </div>
        </div>
      )}

      {isColumnsMode ? (
        <div>
          <label className="block text-xs text-gray-500 mb-2">Contenu des colonnes</label>
          <div
            className="grid gap-4"
            style={{ gridTemplateColumns: layoutToGridCols(state.layout) }}
          >
            {state.blocks.map((block, i) => (
              <BlockEditor
                key={i}
                index={i}
                block={block}
                allMedia={allMedia}
                onChange={handleBlock}
              />
            ))}
          </div>
        </div>
      ) : isMasonryMode ? (
        <MasonryEditor
          allMedia={allMedia}
          selectedIds={state.masonryIds}
          onChangeIds={(ids) => dispatch({ type: "SET_MASONRY_IDS", ids })}
          columns={state.columns}
          onChangeColumns={(c) => dispatch({ type: "SET_FIELD", field: "columns", value: c })}
          gap={state.masonryGap}
          onChangeGap={(gap) => dispatch({ type: "SET_MASONRY_GAP", gap })}
        />
      ) : (
        <div>
          <label className="block text-xs text-gray-500 mb-1">Content</label>
          <textarea
            value={state.content}
            onChange={(e) => dispatch({ type: "SET_FIELD", field: "content", value: e.target.value })}
            rows={12}
            className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 resize-vertical font-mono"
          />
          <p className="text-xs text-gray-400 mt-1"># Titre &nbsp; ## Sous-titre &nbsp; ### Petit titre</p>
        </div>
      )}

      <div className="flex gap-6">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={state.showTitle}
            onChange={(e) => dispatch({ type: "SET_FIELD", field: "showTitle", value: e.target.checked })}
            className="rounded"
          />
          <span className="text-sm text-gray-700">Afficher le titre</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={state.published}
            onChange={(e) => dispatch({ type: "SET_FIELD", field: "published", value: e.target.checked })}
            className="rounded"
          />
          <span className="text-sm text-gray-700">Published</span>
        </label>
      </div>

      <button
        type="submit"
        disabled={saving}
        className="px-6 py-2 bg-gray-900 text-white rounded text-sm hover:bg-gray-800 disabled:opacity-50 flex items-center gap-2"
      >
        {saving && <Spinner />}
        {saving ? "Saving..." : page ? "Save page" : "Create page"}
      </button>
    </form>
  );
}

function BlockEditor({
  index,
  block,
  allMedia,
  onChange,
}: {
  index: number;
  block: ColumnBlock;
  allMedia: Media[];
  onChange: (index: number, block: ColumnBlock) => void;
}) {
  const isText = block.type === "text";
  const images = allMedia.filter((m) => m.mimeType.startsWith("image/"));

  return (
    <div className="border border-gray-200 rounded p-3 space-y-3">
      <div className="flex gap-1">
        <button
          type="button"
          onClick={() =>
            onChange(index, { type: "text", content: isText ? block.content : "" })
          }
          className={`flex items-center gap-1 px-2 py-1 rounded text-xs ${
            isText
              ? "bg-gray-900 text-white"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          <Type size={12} />
          Texte
        </button>
        <button
          type="button"
          onClick={() =>
            onChange(index, {
              type: "media",
              mediaId: !isText ? (block as { mediaId: string }).mediaId : "",
            })
          }
          className={`flex items-center gap-1 px-2 py-1 rounded text-xs ${
            !isText
              ? "bg-gray-900 text-white"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          <ImageIcon size={12} />
          Media
        </button>
      </div>

      {isText ? (
        <div>
          <textarea
            value={block.content}
            onChange={(e) =>
              onChange(index, { type: "text", content: e.target.value })
            }
            rows={6}
            placeholder={`Colonne ${index + 1}`}
            className="w-full px-2 py-1.5 border border-gray-200 rounded text-sm resize-vertical font-mono focus:outline-none focus:ring-1 focus:ring-gray-400"
          />
          <p className="text-xs text-gray-400 mt-1"># ## ###</p>
        </div>
      ) : (
        <MediaPicker
          selected={(block as { mediaId: string }).mediaId}
          images={images}
          onSelect={(mediaId) => onChange(index, { type: "media", mediaId })}
        />
      )}
    </div>
  );
}

function MasonryEditor({
  allMedia,
  selectedIds,
  onChangeIds,
  columns,
  onChangeColumns,
  gap,
  onChangeGap,
}: {
  allMedia: Media[];
  selectedIds: string[];
  onChangeIds: (ids: string[]) => void;
  columns: number;
  onChangeColumns: (c: number) => void;
  gap: number;
  onChangeGap: (g: number) => void;
}) {
  const images = allMedia.filter((m) => m.mimeType.startsWith("image/"));
  const selectedSet = new Set(selectedIds);

  function toggle(id: string) {
    if (selectedSet.has(id)) {
      onChangeIds(selectedIds.filter((i) => i !== id));
    } else {
      onChangeIds([...selectedIds, id]);
    }
  }

  function loadAll() {
    onChangeIds(images.map((m) => m.id));
  }

  function clearAll() {
    onChangeIds([]);
  }

  function moveSelected(index: number, direction: -1 | 1) {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= selectedIds.length) return;
    const updated = [...selectedIds];
    [updated[index], updated[newIndex]] = [updated[newIndex], updated[index]];
    onChangeIds(updated);
  }

  function removeSelected(index: number) {
    onChangeIds(selectedIds.filter((_, i) => i !== index));
  }

  // Resolve selected media in order
  const mediaMap = new Map(images.map((m) => [m.id, m]));
  const selectedMedia = selectedIds
    .map((id) => mediaMap.get(id))
    .filter((m): m is Media => m != null);

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-xs text-gray-500 mb-2">Colonnes</label>
        <div className="flex gap-2">
          {[2, 3, 4].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => onChangeColumns(n)}
              className={`px-3 py-1.5 border rounded text-sm transition-colors ${
                columns === n
                  ? "border-gray-900 bg-gray-50 font-medium"
                  : "border-gray-200 hover:border-gray-400"
              }`}
            >
              {n}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-xs text-gray-500 mb-2">Gap (px)</label>
        <div className="flex gap-2">
          {[0, 4, 8, 12, 16].map((g) => (
            <button
              key={g}
              type="button"
              onClick={() => onChangeGap(g)}
              className={`px-3 py-1.5 border rounded text-sm transition-colors ${
                gap === g
                  ? "border-gray-900 bg-gray-50 font-medium"
                  : "border-gray-200 hover:border-gray-400"
              }`}
            >
              {g}
            </button>
          ))}
        </div>
      </div>

      {selectedMedia.length > 0 && (
        <div>
          <label className="block text-xs text-gray-500 mb-2">
            {selectedMedia.length} image{selectedMedia.length > 1 ? "s" : ""} sélectionnée{selectedMedia.length > 1 ? "s" : ""}
          </label>
          <div className="grid grid-cols-6 gap-1.5 max-h-64 overflow-y-auto">
            {selectedMedia.map((img, i) => (
              <div key={img.id} className="relative group">
                <div className="relative aspect-square rounded overflow-hidden border-2 border-gray-900">
                  <Image
                    src={mediaUrl(img.path)}
                    alt={img.altText || img.filename}
                    fill
                    className="object-cover"
                    sizes="80px"
                  />
                </div>
                <div className="absolute top-0 right-0 flex flex-col opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    type="button"
                    onClick={() => moveSelected(i, -1)}
                    disabled={i === 0}
                    className="bg-white/90 p-0.5 rounded-bl text-gray-700 hover:text-gray-900 disabled:opacity-30"
                  >
                    <ChevronUp size={12} />
                  </button>
                  <button
                    type="button"
                    onClick={() => moveSelected(i, 1)}
                    disabled={i === selectedMedia.length - 1}
                    className="bg-white/90 p-0.5 rounded-bl text-gray-700 hover:text-gray-900 disabled:opacity-30"
                  >
                    <ChevronDown size={12} />
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => removeSelected(i)}
                  className="absolute top-0 left-0 bg-white/90 p-0.5 rounded-br opacity-0 group-hover:opacity-100 transition-opacity text-red-500 hover:text-red-700"
                >
                  <X size={12} />
                </button>
                <span className="absolute bottom-0.5 left-0.5 bg-gray-900 text-white text-[10px] px-1 rounded">
                  {i + 1}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div>
        <div className="flex items-center gap-2 mb-2">
          <label className="text-xs text-gray-500">Images disponibles</label>
          <button
            type="button"
            onClick={loadAll}
            className="text-xs px-2 py-0.5 bg-gray-100 hover:bg-gray-200 rounded transition-colors"
          >
            Tout sélectionner
          </button>
          {selectedIds.length > 0 && (
            <button
              type="button"
              onClick={clearAll}
              className="text-xs px-2 py-0.5 bg-gray-100 hover:bg-gray-200 rounded transition-colors"
            >
              Tout désélectionner
            </button>
          )}
        </div>
        {images.length === 0 ? (
          <p className="text-xs text-gray-400 py-4 text-center">
            Aucun media disponible. Ajoutez des images via un projet.
          </p>
        ) : (
          <div className="grid grid-cols-6 gap-1.5 max-h-64 overflow-y-auto">
            {images.map((img) => {
              const isSelected = selectedSet.has(img.id);
              return (
                <button
                  key={img.id}
                  type="button"
                  onClick={() => toggle(img.id)}
                  className={`relative aspect-square rounded overflow-hidden border-2 transition-all ${
                    isSelected
                      ? "border-gray-900 opacity-100"
                      : "border-transparent opacity-50 hover:opacity-75 hover:border-gray-300"
                  }`}
                >
                  <Image
                    src={mediaUrl(img.path)}
                    alt={img.altText || img.filename}
                    fill
                    className="object-cover"
                    sizes="80px"
                  />
                  {isSelected && (
                    <span className="absolute top-0.5 right-0.5 bg-gray-900 text-white text-[10px] w-4 h-4 flex items-center justify-center rounded-full">
                      {selectedIds.indexOf(img.id) + 1}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function MediaPicker({
  selected,
  images,
  onSelect,
}: {
  selected: string;
  images: Media[];
  onSelect: (mediaId: string) => void;
}) {
  if (images.length === 0) {
    return (
      <p className="text-xs text-gray-400 py-4 text-center">
        Aucun media disponible. Ajoutez des images via un projet.
      </p>
    );
  }

  return (
    <div className="grid grid-cols-3 gap-1.5 max-h-48 overflow-y-auto">
      {images.map((img) => (
        <button
          key={img.id}
          type="button"
          onClick={() => onSelect(img.id)}
          className={`relative aspect-square rounded overflow-hidden border-2 transition-colors ${
            selected === img.id
              ? "border-gray-900"
              : "border-transparent hover:border-gray-300"
          }`}
        >
          <Image
            src={mediaUrl(img.path)}
            alt={img.altText || img.filename}
            fill
            className="object-cover"
            sizes="80px"
          />
        </button>
      ))}
    </div>
  );
}
