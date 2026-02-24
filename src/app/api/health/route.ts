// Copyright (c) 2026 Jérémy Vtipil
// Licensed under the GNU Affero General Public License v3.0

import { NextResponse } from "next/server";
import { db } from "@/lib/db";

const startedAt = Date.now();

export async function GET() {
  const uptime = Math.floor((Date.now() - startedAt) / 1000);
  const mem = process.memoryUsage();

  let dbOk = true;
  try {
    await db.$queryRaw`SELECT 1`;
  } catch {
    dbOk = false;
  }

  return NextResponse.json(
    {
      status: dbOk ? "ok" : "degraded",
      version: process.env.npm_package_version || "0.1.0",
      uptime,
      memory: {
        rss: Math.round(mem.rss / 1024 / 1024),
        heapUsed: Math.round(mem.heapUsed / 1024 / 1024),
        heapTotal: Math.round(mem.heapTotal / 1024 / 1024),
      },
      checks: {
        database: dbOk ? "ok" : "unreachable",
      },
    },
    { status: dbOk ? 200 : 503 }
  );
}
