// Copyright (c) 2026 Jérémy Vtipil
// Licensed under the GNU Affero General Public License v3.0

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useToast } from "@/components/ui/toast";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useConfirm } from "@/hooks/use-confirm";
import { apiJson, apiCall } from "@/lib/api-client";
import { Trash2, Star, StarOff, Home } from "lucide-react";
import type { Page } from "@prisma/client";

export function PageManager({
  pages: initialPages,
  aboutPageId,
  homePageId,
}: {
  pages: Page[];
  aboutPageId: string | null;
  homePageId: string | null;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [pages, setPages] = useState(initialPages);
  const { isOpen, requestConfirm, cancel, confirm } = useConfirm();

  async function handleDelete() {
    const id = confirm();
    if (!id) return;

    const { error } = await apiCall(`/api/pages/${id}`, { method: "DELETE" });
    if (!error) {
      setPages((prev) => prev.filter((p) => p.id !== id));
      toast("Page deleted");
      router.refresh();
    } else {
      toast(error, "error");
    }
  }

  async function handleSetAbout(pageId: string | null) {
    const { error } = await apiJson("/api/tenant", "PUT", {
      aboutPageId: pageId || "",
    });

    if (!error) {
      toast(pageId ? "Set as About page" : "About page unset");
      router.refresh();
    } else {
      toast(error, "error");
    }
  }

  async function handleSetHome(pageId: string | null) {
    const { error } = await apiJson("/api/tenant", "PUT", {
      homePageId: pageId || "",
    });

    if (!error) {
      toast(pageId ? "Set as Homepage" : "Homepage unset");
      router.refresh();
    } else {
      toast(error, "error");
    }
  }

  return (
    <div className="space-y-6">
      <Link
        href="/admin/pages/new"
        className="inline-block px-4 py-2 bg-gray-900 text-white rounded text-sm no-underline hover:bg-gray-800"
      >
        New page
      </Link>

      <div className="space-y-2">
        {pages.length === 0 && (
          <p className="text-sm text-gray-500">No pages yet.</p>
        )}
        {pages.map((page) => {
          const isAbout = page.id === aboutPageId;
          const isHome = page.id === homePageId;
          return (
            <div
              key={page.id}
              className="flex items-center gap-3 bg-white p-4 rounded-lg shadow-sm"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <Link
                    href={`/admin/pages/${page.id}`}
                    className="text-sm font-medium text-gray-900 no-underline hover:underline"
                  >
                    {page.title}
                  </Link>
                  {isHome && (
                    <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded">
                      Homepage
                    </span>
                  )}
                  {isAbout && (
                    <span className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">
                      About
                    </span>
                  )}
                  {!page.published && (
                    <span className="text-xs bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded">
                      Draft
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-500">/{page.slug}</p>
              </div>

              <button
                onClick={() => handleSetHome(isHome ? null : page.id)}
                className={`p-1 bg-transparent border-0 cursor-pointer ${
                  isHome
                    ? "text-green-600 hover:text-green-800"
                    : "text-gray-400 hover:text-green-600"
                }`}
                title={isHome ? "Unset as Homepage" : "Set as Homepage"}
              >
                <Home size={16} />
              </button>

              <button
                onClick={() => handleSetAbout(isAbout ? null : page.id)}
                className="p-1 text-gray-400 hover:text-blue-600 bg-transparent border-0 cursor-pointer"
                title={isAbout ? "Unset as About" : "Set as About"}
              >
                {isAbout ? <StarOff size={16} /> : <Star size={16} />}
              </button>

              <button
                onClick={() => requestConfirm(page.id)}
                className="p-1 text-red-400 hover:text-red-600 bg-transparent border-0 cursor-pointer"
              >
                <Trash2 size={16} />
              </button>
            </div>
          );
        })}
      </div>

      <ConfirmDialog
        open={isOpen}
        title="Delete page"
        message="This page will be permanently deleted. This action cannot be undone."
        confirmLabel="Delete"
        variant="danger"
        onConfirm={handleDelete}
        onCancel={cancel}
      />
    </div>
  );
}
