// Copyright (c) 2026 Jérémy Vtipil
// Licensed under the GNU Affero General Public License v3.0

import { getTenant } from "@/lib/tenant";
import { getOptionalAuth } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { AdminSidebar } from "@/components/admin/sidebar";
import { ToastProvider } from "@/components/ui/toast";
import { VerificationBanner } from "@/components/admin/verification-banner";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const tenant = await getTenant();
  if (!tenant) redirect("/");

  const auth = await getOptionalAuth();

  let showVerificationBanner = false;
  if (auth) {
    const user = await db.user.findUnique({
      where: { id: auth.userId },
      select: { emailVerified: true },
    });
    showVerificationBanner = !user?.emailVerified;
  }

  return (
    <ToastProvider>
      <div className="min-h-screen flex bg-gray-50">
        <AdminSidebar tenant={tenant} isLoggedIn={!!auth} />
        <div className="flex-1 flex flex-col">
          {showVerificationBanner && <VerificationBanner />}
          <main className="flex-1 p-8">{children}</main>
        </div>
      </div>
    </ToastProvider>
  );
}
