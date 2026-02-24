// Copyright (c) 2026 Jérémy Vtipil
// Licensed under the GNU Affero General Public License v3.0

/**
 * Client-side API helper. Wraps fetch with JSON handling and
 * extracts server error messages for user-facing feedback.
 *
 * Returns { data, error } — never throws.
 */

type ApiResult<T> = { data: T; error: null } | { data: null; error: string };

export async function apiCall<T = unknown>(
  url: string,
  opts?: RequestInit
): Promise<ApiResult<T>> {
  try {
    const res = await fetch(url, opts);

    if (res.ok) {
      // Some endpoints (DELETE) may return no body
      const text = await res.text();
      const data = text ? (JSON.parse(text) as T) : (null as T);
      return { data, error: null };
    }

    // Try to extract server error message
    const body = await res.json().catch(() => null);
    const message = body?.error || `Request failed (${res.status})`;
    return { data: null, error: message };
  } catch {
    return { data: null, error: "Network error" };
  }
}

/** Shorthand for JSON POST/PUT/DELETE */
export function apiJson<T = unknown>(
  url: string,
  method: "POST" | "PUT" | "DELETE",
  body?: unknown
): Promise<ApiResult<T>> {
  return apiCall<T>(url, {
    method,
    headers: body !== undefined ? { "Content-Type": "application/json" } : undefined,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
}
