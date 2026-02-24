// Copyright (c) 2026 Jérémy Vtipil
// Licensed under the GNU Affero General Public License v3.0

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/toast";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useConfirm } from "@/hooks/use-confirm";
import { apiJson, apiCall } from "@/lib/api-client";
import { useAutoSlug } from "@/hooks/use-auto-slug";
import { ChevronUp, ChevronDown, Trash2 } from "lucide-react";

type CategoryWithCount = {
  id: string;
  name: string;
  slug: string;
  columnCount: number;
  sortOrder: number;
  _count: { projects: number };
};

export function CategoryManager({
  categories: initialCategories,
}: {
  categories: CategoryWithCount[];
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [categories, setCategories] = useState(initialCategories);
  const { isOpen, requestConfirm, cancel, confirm } = useConfirm();
  const { title: newName, setTitle: setNewName, slug: newSlug, setSlug: setNewSlug } = useAutoSlug(
    { title: "", slug: "" },
    false
  );

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!newName || !newSlug) return;

    const { error } = await apiJson("/api/categories", "POST", {
      name: newName,
      slug: newSlug,
    });

    if (!error) {
      setNewName("");
      toast("Category created");
      router.refresh();
    } else {
      toast(error, "error");
    }
  }

  async function handleDelete() {
    const id = confirm();
    if (!id) return;

    const { error } = await apiCall(`/api/categories/${id}`, { method: "DELETE" });
    if (!error) {
      setCategories((prev) => prev.filter((c) => c.id !== id));
      toast("Category deleted");
      router.refresh();
    } else {
      toast(error, "error");
    }
  }

  async function handleUpdateColumns(id: string, columnCount: number) {
    const { error } = await apiJson(`/api/categories/${id}`, "PUT", { columnCount });
    if (!error) {
      setCategories((prev) =>
        prev.map((c) => (c.id === id ? { ...c, columnCount } : c))
      );
    } else {
      toast(error, "error");
    }
  }

  async function handleMove(index: number, direction: -1 | 1) {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= categories.length) return;

    const updated = [...categories];
    [updated[index], updated[newIndex]] = [updated[newIndex], updated[index]];

    const reordered = updated.map((cat, i) => ({ ...cat, sortOrder: i }));
    setCategories(reordered);

    const { error } = await apiJson(
      "/api/categories/reorder",
      "PUT",
      reordered.map((c) => ({ id: c.id, sortOrder: c.sortOrder }))
    );

    if (error) {
      setCategories(initialCategories);
      toast(error, "error");
    } else {
      router.refresh();
    }
  }

  return (
    <div className="space-y-6">
      <form
        onSubmit={handleCreate}
        className="flex gap-2 bg-white p-4 rounded-lg shadow-sm"
      >
        <input
          type="text"
          placeholder="Name"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          className="flex-1 px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
        />
        <input
          type="text"
          placeholder="Slug"
          value={newSlug}
          onChange={(e) => setNewSlug(e.target.value)}
          className="w-40 px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
        />
        <button
          type="submit"
          className="px-4 py-2 bg-gray-900 text-white rounded text-sm hover:bg-gray-800"
        >
          Add
        </button>
      </form>

      <div className="space-y-2">
        {categories.map((cat, i) => (
          <div
            key={cat.id}
            className="flex items-center gap-2 bg-white p-4 rounded-lg shadow-sm"
          >
            <div className="flex flex-col gap-0.5">
              <button
                onClick={() => handleMove(i, -1)}
                disabled={i === 0}
                className="p-0.5 text-gray-400 hover:text-gray-700 disabled:opacity-20 bg-transparent border-0 cursor-pointer disabled:cursor-default"
              >
                <ChevronUp size={16} />
              </button>
              <button
                onClick={() => handleMove(i, 1)}
                disabled={i === categories.length - 1}
                className="p-0.5 text-gray-400 hover:text-gray-700 disabled:opacity-20 bg-transparent border-0 cursor-pointer disabled:cursor-default"
              >
                <ChevronDown size={16} />
              </button>
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900">{cat.name}</p>
              <p className="text-xs text-gray-500">
                /{cat.slug} &middot; {cat._count.projects} projects
              </p>
            </div>
            <select
              value={cat.columnCount || 1}
              onChange={(e) => handleUpdateColumns(cat.id, Number(e.target.value))}
              className="text-xs border border-gray-200 rounded px-2 py-1 bg-white"
              title="Grid columns"
            >
              {[1, 2, 3, 4].map((n) => (
                <option key={n} value={n}>
                  {n} col{n > 1 ? "s" : ""}
                </option>
              ))}
            </select>
            <button
              onClick={() => requestConfirm(cat.id)}
              className="p-1 text-red-400 hover:text-red-600 bg-transparent border-0 cursor-pointer"
            >
              <Trash2 size={16} />
            </button>
          </div>
        ))}
      </div>

      <ConfirmDialog
        open={isOpen}
        title="Delete category"
        message="This will permanently delete the category and all its projects. This action cannot be undone."
        confirmLabel="Delete"
        variant="danger"
        onConfirm={handleDelete}
        onCancel={cancel}
      />
    </div>
  );
}
