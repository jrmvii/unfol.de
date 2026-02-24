// Copyright (c) 2026 Jérémy Vtipil
// Licensed under the GNU Affero General Public License v3.0

import { useState, useCallback } from "react";
import { slugify } from "@/lib/utils";

/**
 * Manages a title + slug pair with auto-slug on title change.
 * Auto-slugging is active only when `isEditing` is false (i.e. creating new items).
 */
export function useAutoSlug(initial: { title: string; slug: string }, isEditing: boolean) {
  const [title, setTitleRaw] = useState(initial.title);
  const [slug, setSlug] = useState(initial.slug);

  const setTitle = useCallback(
    (value: string) => {
      setTitleRaw(value);
      if (!isEditing) {
        setSlug(slugify(value));
      }
    },
    [isEditing]
  );

  return { title, setTitle, slug, setSlug };
}
