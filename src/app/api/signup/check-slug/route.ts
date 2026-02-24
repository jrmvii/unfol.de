// Copyright (c) 2026 Jérémy Vtipil
// Licensed under the GNU Affero General Public License v3.0

import { NextResponse } from "next/server";
import { checkSlugSchema } from "@/lib/schemas";
import { validateSlugAvailability } from "@/lib/slug-validation";

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const result = checkSlugSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json({ available: false, reason: "Invalid format. Use lowercase letters, numbers, and hyphens." });
  }

  const slugCheck = await validateSlugAvailability(result.data.slug);
  return NextResponse.json(slugCheck);
}
