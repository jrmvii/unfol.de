// Copyright (c) 2026 Jérémy Vtipil
// Licensed under the GNU Affero General Public License v3.0

import { PageEditor } from "@/components/admin/page-editor";

export default function NewPagePage() {
  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-900 mb-8">New page</h1>
      <PageEditor page={null} />
    </div>
  );
}
