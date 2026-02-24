// Copyright (c) 2026 Jérémy Vtipil
// Licensed under the GNU Affero General Public License v3.0

"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import type { Project, Media, Category } from "@prisma/client";
import { useToast } from "@/components/ui/toast";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Spinner } from "@/components/ui/spinner";
import { useConfirm } from "@/hooks/use-confirm";
import { apiJson, apiCall } from "@/lib/api-client";
import { useAutoSlug } from "@/hooks/use-auto-slug";
import { mediaUrl } from "@/lib/media-utils";
import { GripVertical, Trash2 } from "lucide-react";

type ProjectWithMedia = Project & { media: Media[]; category: Category };

export function ProjectEditor({
  project,
  categories,
}: {
  project: ProjectWithMedia | null;
  categories: Category[];
}) {
  const router = useRouter();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { title, setTitle, slug, setSlug } = useAutoSlug(
    { title: project?.title || "", slug: project?.slug || "" },
    !!project
  );
  const [categoryId, setCategoryId] = useState(
    project?.categoryId || categories[0]?.id || ""
  );
  const [description, setDescription] = useState(project?.description || "");
  const [published, setPublished] = useState(project?.published ?? true);
  const [media, setMedia] = useState<Media[]>(project?.media || []);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const { isOpen, requestConfirm, cancel, confirm: confirmDelete } = useConfirm();
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    const body = { title, slug, categoryId, description, published };
    const url = project ? `/api/projects/${project.id}` : "/api/projects";
    const method = project ? "PUT" : "POST";

    const { data, error } = await apiJson<{ id: string }>(url, method, body);

    if (!error) {
      if (!project && data) {
        router.push(`/admin/projects/${data.id}`);
      }
      toast("Project saved");
      router.refresh();
    } else {
      toast(error, "error");
    }
    setSaving(false);
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files?.length || !project) return;
    setUploading(true);

    const formData = new FormData();
    formData.set("projectId", project.id);
    for (const file of files) {
      formData.append("files", file);
    }

    const { data, error } = await apiCall<Media[]>("/api/media", {
      method: "POST",
      body: formData,
    });
    if (!error && data) {
      setMedia((prev) => [...prev, ...data]);
      toast(`${data.length} file(s) uploaded`);
    } else {
      toast(error || "Upload failed", "error");
    }
    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function handleDeleteMedia() {
    const id = confirmDelete();
    if (!id) return;

    const { error } = await apiCall(`/api/media/${id}`, { method: "DELETE" });
    if (!error) {
      setMedia((prev) => prev.filter((m) => m.id !== id));
      toast("Media deleted");
    } else {
      toast(error, "error");
    }
  }

  function handleDragStart(index: number) {
    setDragIndex(index);
  }

  function handleDragOver(e: React.DragEvent, index: number) {
    e.preventDefault();
    setDragOverIndex(index);
  }

  async function handleDrop(targetIndex: number) {
    if (dragIndex === null || dragIndex === targetIndex) {
      setDragIndex(null);
      setDragOverIndex(null);
      return;
    }

    const updated = [...media];
    const [moved] = updated.splice(dragIndex, 1);
    updated.splice(targetIndex, 0, moved);

    const reordered = updated.map((m, i) => ({ ...m, sortOrder: i }));
    setMedia(reordered);
    setDragIndex(null);
    setDragOverIndex(null);

    const { error } = await apiJson(
      "/api/media/reorder",
      "PUT",
      reordered.map((m) => ({ id: m.id, sortOrder: m.sortOrder }))
    );

    if (error) {
      setMedia(project?.media || []);
      toast(error, "error");
    }
  }

  function handleDragEnd() {
    setDragIndex(null);
    setDragOverIndex(null);
  }

  return (
    <div className="space-y-8">
      <form onSubmit={handleSave} className="bg-white p-6 rounded-lg shadow-sm space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
              required
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Slug</label>
            <input
              type="text"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Category</label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
            >
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-end">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={published}
                onChange={(e) => setPublished(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 accent-gray-900"
              />
              <span className="text-sm text-gray-700">Published</span>
            </label>
          </div>
        </div>

        <div>
          <label className="block text-xs text-gray-500 mb-1">
            Description (optional)
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 resize-vertical"
          />
        </div>

        <button
          type="submit"
          disabled={saving}
          className="px-4 py-2 bg-gray-900 text-white rounded text-sm hover:bg-gray-800 disabled:opacity-50 flex items-center gap-2"
        >
          {saving && <Spinner />}
          {saving ? "Saving..." : project ? "Save" : "Create"}
        </button>
      </form>

      {project && (
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium text-gray-900">
              Media ({media.length})
            </h2>
            <label className="px-4 py-2 bg-gray-900 text-white rounded text-sm hover:bg-gray-800 cursor-pointer">
              {uploading ? "Uploading..." : "Upload files"}
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*,video/mp4"
                onChange={handleUpload}
                className="hidden"
                disabled={uploading}
              />
            </label>
          </div>

          <div className="grid grid-cols-4 gap-3">
            {media.map((m, i) => (
              <div
                key={m.id}
                draggable
                onDragStart={() => handleDragStart(i)}
                onDragOver={(e) => handleDragOver(e, i)}
                onDrop={() => handleDrop(i)}
                onDragEnd={handleDragEnd}
                className={`relative group cursor-grab active:cursor-grabbing rounded border-2 transition-colors ${
                  dragOverIndex === i && dragIndex !== i
                    ? "border-gray-400"
                    : "border-transparent"
                } ${dragIndex === i ? "opacity-40" : ""}`}
              >
                {m.mimeType.startsWith("image/") ? (
                  <Image
                    src={mediaUrl(m.path)}
                    alt={m.altText || ""}
                    width={200}
                    height={200}
                    className="w-full aspect-square object-cover rounded"
                    sizes="200px"
                    unoptimized={m.mimeType === "image/gif"}
                  />
                ) : (
                  <video
                    src={mediaUrl(m.path)}
                    muted
                    className="w-full aspect-square object-cover rounded"
                  />
                )}
                <div className="absolute top-1 left-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <GripVertical size={16} className="text-white drop-shadow-md" />
                </div>
                <button
                  onClick={() => requestConfirm(m.id)}
                  className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full text-xs opacity-0 group-hover:opacity-100 transition-opacity border-0 cursor-pointer flex items-center justify-center"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            ))}
          </div>

          <ConfirmDialog
            open={isOpen}
            title="Delete media"
            message="This file will be permanently deleted. This action cannot be undone."
            confirmLabel="Delete"
            variant="danger"
            onConfirm={handleDeleteMedia}
            onCancel={cancel}
          />
        </div>
      )}
    </div>
  );
}
