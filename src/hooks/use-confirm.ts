// Copyright (c) 2026 Jérémy Vtipil
// Licensed under the GNU Affero General Public License v3.0

import { useState, useCallback } from "react";

export function useConfirm() {
  const [pendingId, setPendingId] = useState<string | null>(null);

  const requestConfirm = useCallback((id: string) => setPendingId(id), []);
  const cancel = useCallback(() => setPendingId(null), []);
  const confirm = useCallback(() => {
    const id = pendingId;
    setPendingId(null);
    return id;
  }, [pendingId]);

  return { pendingId, isOpen: pendingId !== null, requestConfirm, cancel, confirm };
}
