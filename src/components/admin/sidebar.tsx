// Copyright (c) 2026 Jérémy Vtipil
// Licensed under the GNU Affero General Public License v3.0

"use client";

import type { Tenant } from "@prisma/client";
import { Sidebar } from "@/components/ui/sidebar";

const navItems = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/analytics", label: "Analytics" },
  { href: "/admin/categories", label: "Categories" },
  { href: "/admin/projects", label: "Projects" },
  { href: "/admin/pages", label: "Pages" },
  { href: "/admin/settings", label: "Settings" },
  { href: "/admin/account", label: "Account" },
];

export function AdminSidebar({
  tenant,
  isLoggedIn,
}: {
  tenant: Tenant;
  isLoggedIn: boolean;
}) {
  return (
    <Sidebar
      title={tenant.name}
      items={navItems}
      logoutRedirect="/admin/login"
      viewHref="/"
      isLoggedIn={isLoggedIn}
    />
  );
}
