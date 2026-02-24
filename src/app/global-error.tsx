// Copyright (c) 2026 Jérémy Vtipil
// Licensed under the GNU Affero General Public License v3.0

"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="en">
      <body style={{ margin: 0, fontFamily: "system-ui, -apple-system, sans-serif" }}>
        <div
          style={{
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "#fff",
          }}
        >
          <div style={{ textAlign: "center" }}>
            <h1 style={{ fontSize: "2.25rem", fontWeight: 300, color: "#111827", marginBottom: "1rem" }}>
              Something went wrong
            </h1>
            <p style={{ color: "#9ca3af", fontWeight: 300, marginBottom: "1.5rem" }}>
              An unexpected error occurred.
            </p>
            <button
              onClick={reset}
              style={{
                padding: "0.5rem 1rem",
                background: "#111827",
                color: "#fff",
                border: "none",
                borderRadius: "0.25rem",
                fontSize: "0.875rem",
                cursor: "pointer",
              }}
            >
              Try again
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
