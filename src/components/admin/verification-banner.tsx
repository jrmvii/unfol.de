// Copyright (c) 2026 Jérémy Vtipil
// Licensed under the GNU Affero General Public License v3.0

"use client";

import { useState } from "react";

export function VerificationBanner() {
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");

  async function handleResend() {
    setStatus("sending");
    try {
      const res = await fetch("/api/auth/resend-verification", { method: "POST" });
      if (!res.ok) {
        const data = await res.json();
        if (data.error === "Email is already verified") {
          // Already verified — reload to clear banner
          window.location.reload();
          return;
        }
        setStatus("error");
        return;
      }
      setStatus("sent");
    } catch {
      setStatus("error");
    }
  }

  return (
    <div className="bg-amber-50 border-b border-amber-200 px-4 py-2.5 text-sm text-amber-800 flex items-center justify-between">
      <span>
        Please verify your email. Check your inbox or{" "}
        {status === "idle" && (
          <button
            onClick={handleResend}
            className="underline hover:text-amber-900 font-medium"
          >
            resend verification email
          </button>
        )}
        {status === "sending" && (
          <span className="text-amber-600">sending...</span>
        )}
        {status === "sent" && (
          <span className="text-green-700 font-medium">sent! Check your inbox.</span>
        )}
        {status === "error" && (
          <>
            <span className="text-red-600">failed to send. </span>
            <button
              onClick={handleResend}
              className="underline hover:text-amber-900 font-medium"
            >
              Try again
            </button>
          </>
        )}
      </span>
    </div>
  );
}
