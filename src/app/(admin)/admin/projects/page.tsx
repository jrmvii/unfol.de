// Copyright (c) 2026 Jérémy Vtipil
// Licensed under the GNU Affero General Public License v3.0

import { requireAuth } from "@/lib/auth";
import { db } from "@/lib/db";
import Link from "next/link";
import Image from "next/image";
import { mediaUrl } from "@/lib/media-utils";

export default async function ProjectsPage() {
  const { tenantId } = await requireAuth();

  const projects = await db.project.findMany({
    where: { tenantId },
    orderBy: [{ category: { sortOrder: "asc" } }, { sortOrder: "asc" }],
    include: {
      category: { select: { name: true } },
      media: {
        where: { mimeType: { startsWith: "image/" } },
        take: 1,
        orderBy: { sortOrder: "asc" },
      },
      _count: { select: { media: true } },
    },
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-semibold text-gray-900">Projects</h1>
        <Link
          href="/admin/projects/new"
          className="px-4 py-2 bg-gray-900 text-white rounded text-sm hover:bg-gray-800"
        >
          New project
        </Link>
      </div>

      <div className="space-y-2">
        {projects.map((project) => (
          <Link
            key={project.id}
            href={`/admin/projects/${project.id}`}
            className="flex items-center gap-4 bg-white p-4 rounded-lg shadow-sm hover:shadow no-underline"
          >
            {project.media[0] ? (
              <div className="relative w-16 h-16 rounded overflow-hidden flex-shrink-0">
                <Image
                  src={mediaUrl(project.media[0].path)}
                  alt=""
                  fill
                  className="object-cover"
                  sizes="64px"
                  unoptimized={project.media[0].mimeType === "image/gif"}
                />
              </div>
            ) : (
              <div className="w-16 h-16 rounded bg-gray-100 flex-shrink-0" />
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {project.title}
                </p>
                {!project.published && (
                  <span className="px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider bg-amber-100 text-amber-700 rounded">
                    Draft
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-500">
                {project.category.name} &middot; {project._count.media} media
              </p>
            </div>
          </Link>
        ))}

        {projects.length === 0 && (
          <p className="text-sm text-gray-500 text-center py-8">
            No projects yet.
          </p>
        )}
      </div>
    </div>
  );
}
