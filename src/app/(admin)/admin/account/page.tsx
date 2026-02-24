// Copyright (c) 2026 Jérémy Vtipil
// Licensed under the GNU Affero General Public License v3.0

import { requireAuth } from "@/lib/auth";
import { db } from "@/lib/db";
import { AccountSettings } from "@/components/admin/account-settings";

export default async function AccountPage() {
  const { userId, tenantId } = await requireAuth();

  const [user, tenant] = await Promise.all([
    db.user.findUnique({ where: { id: userId }, select: { email: true } }),
    db.tenant.findUnique({ where: { id: tenantId }, select: { slug: true } }),
  ]);

  if (!user || !tenant) throw new Error("Account not found");

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-semibold text-gray-900">Account</h1>
      <AccountSettings email={user.email} slug={tenant.slug} />
    </div>
  );
}
