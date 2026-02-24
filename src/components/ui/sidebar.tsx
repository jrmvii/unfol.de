// Copyright (c) 2026 Jérémy Vtipil
// Licensed under the GNU Affero General Public License v3.0

"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

interface NavItem {
  href: string;
  label: string;
}

export function Sidebar({
  title,
  items,
  logoutRedirect,
  viewHref,
  viewLabel = "View site",
  isLoggedIn,
}: {
  title: string;
  items: NavItem[];
  logoutRedirect: string;
  viewHref: string;
  viewLabel?: string;
  isLoggedIn: boolean;
}) {
  const pathname = usePathname();
  const router = useRouter();

  if (!isLoggedIn) return null;

  const rootHref = items[0]?.href;

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push(logoutRedirect);
    router.refresh();
  }

  return (
    <aside className="w-56 bg-white border-r border-gray-200 p-6 flex flex-col">
      <p className="text-sm font-bold text-gray-900 mb-6 truncate">{title}</p>

      <nav className="space-y-1 flex-1">
        {items.map((item) => {
          const isActive =
            item.href === rootHref
              ? pathname === item.href
              : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`block px-3 py-2 rounded text-sm no-underline ${
                isActive
                  ? "bg-gray-100 text-gray-900 font-medium"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="pt-4 border-t border-gray-200 space-y-2">
        <Link
          href={viewHref}
          className="block text-xs text-gray-500 hover:text-gray-900 no-underline"
        >
          {viewLabel}
        </Link>
        <button
          onClick={handleLogout}
          className="text-xs text-gray-500 hover:text-gray-900 bg-transparent border-0 p-0 cursor-pointer"
        >
          Sign out
        </button>
      </div>
    </aside>
  );
}
