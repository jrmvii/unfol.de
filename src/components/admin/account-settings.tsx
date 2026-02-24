// Copyright (c) 2026 Jérémy Vtipil
// Licensed under the GNU Affero General Public License v3.0

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function AccountSettings({ email, slug }: { email: string; slug: string }) {
  return (
    <div className="space-y-8 max-w-lg">
      <ChangePasswordSection />
      <ChangeEmailSection currentEmail={email} />
      <DeleteAccountSection slug={slug} />
    </div>
  );
}

function ChangePasswordSection() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess(false);

    if (newPassword !== confirm) {
      setError("Passwords don't match");
      return;
    }

    setLoading(true);
    const res = await fetch("/api/auth/password", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPassword, newPassword }),
    });
    setLoading(false);

    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "Failed to change password");
      return;
    }

    setSuccess(true);
    setCurrentPassword("");
    setNewPassword("");
    setConfirm("");
  }

  return (
    <section className="bg-white border border-gray-200 rounded-lg p-6">
      <h2 className="text-lg font-medium text-gray-900 mb-4">Change password</h2>

      {success && (
        <p className="text-sm text-green-700 bg-green-50 p-2 rounded mb-4">
          Password updated successfully.
        </p>
      )}
      {error && (
        <p className="text-sm text-red-600 bg-red-50 p-2 rounded mb-4">{error}</p>
      )}

      <form onSubmit={handleSubmit} className="space-y-3">
        <input
          type="password"
          placeholder="Current password"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          required
          className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
        />
        <input
          type="password"
          placeholder="New password (min. 8 characters)"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          required
          minLength={8}
          className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
        />
        <input
          type="password"
          placeholder="Confirm new password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          required
          minLength={8}
          className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
        />
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 bg-gray-900 text-white rounded text-sm hover:bg-gray-800 disabled:opacity-50"
        >
          {loading ? "Saving..." : "Update password"}
        </button>
      </form>
    </section>
  );
}

function ChangeEmailSection({ currentEmail }: { currentEmail: string }) {
  const router = useRouter();
  const [newEmail, setNewEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess(false);
    setLoading(true);

    const res = await fetch("/api/auth/email", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ newEmail, password }),
    });
    setLoading(false);

    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "Failed to change email");
      return;
    }

    setSuccess(true);
    setNewEmail("");
    setPassword("");
    router.refresh();
  }

  return (
    <section className="bg-white border border-gray-200 rounded-lg p-6">
      <h2 className="text-lg font-medium text-gray-900 mb-1">Change email</h2>
      <p className="text-sm text-gray-500 mb-4">Current: {currentEmail}</p>

      {success && (
        <p className="text-sm text-green-700 bg-green-50 p-2 rounded mb-4">
          Email updated successfully.
        </p>
      )}
      {error && (
        <p className="text-sm text-red-600 bg-red-50 p-2 rounded mb-4">{error}</p>
      )}

      <form onSubmit={handleSubmit} className="space-y-3">
        <input
          type="email"
          placeholder="New email"
          value={newEmail}
          onChange={(e) => setNewEmail(e.target.value)}
          required
          className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
        />
        <input
          type="password"
          placeholder="Confirm with your password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
        />
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 bg-gray-900 text-white rounded text-sm hover:bg-gray-800 disabled:opacity-50"
        >
          {loading ? "Saving..." : "Update email"}
        </button>
      </form>
    </section>
  );
}

function DeleteAccountSection({ slug }: { slug: string }) {
  const router = useRouter();
  const [confirmSlug, setConfirmSlug] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  async function handleDelete(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const res = await fetch("/api/auth/account", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug: confirmSlug, password }),
    });
    setLoading(false);

    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "Failed to delete account");
      return;
    }

    router.push("/");
  }

  return (
    <section className="bg-white border border-red-200 rounded-lg p-6">
      <h2 className="text-lg font-medium text-red-700 mb-1">Danger zone</h2>
      <p className="text-sm text-gray-500 mb-4">
        Permanently delete your account and all associated data (projects, media, pages).
        This action cannot be undone.
      </p>

      {!showConfirm ? (
        <button
          onClick={() => setShowConfirm(true)}
          className="px-4 py-2 border border-red-300 text-red-700 rounded text-sm hover:bg-red-50"
        >
          Delete account
        </button>
      ) : (
        <form onSubmit={handleDelete} className="space-y-3">
          {error && (
            <p className="text-sm text-red-600 bg-red-50 p-2 rounded">{error}</p>
          )}
          <p className="text-sm text-gray-600">
            Type <strong>{slug}</strong> to confirm:
          </p>
          <input
            type="text"
            placeholder={slug}
            value={confirmSlug}
            onChange={(e) => setConfirmSlug(e.target.value)}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
          />
          <input
            type="password"
            placeholder="Your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
          />
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={loading || confirmSlug !== slug}
              className="px-4 py-2 bg-red-600 text-white rounded text-sm hover:bg-red-700 disabled:opacity-50"
            >
              {loading ? "Deleting..." : "Permanently delete"}
            </button>
            <button
              type="button"
              onClick={() => { setShowConfirm(false); setConfirmSlug(""); setPassword(""); setError(""); }}
              className="px-4 py-2 border border-gray-300 rounded text-sm hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </section>
  );
}
