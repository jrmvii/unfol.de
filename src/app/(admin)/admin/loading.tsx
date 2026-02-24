// Copyright (c) 2026 Jérémy Vtipil
// Licensed under the GNU Affero General Public License v3.0

export default function AdminLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-8 w-48 bg-gray-200 rounded" />
      <div className="space-y-4">
        <div className="h-4 w-full max-w-md bg-gray-200 rounded" />
        <div className="h-4 w-full max-w-sm bg-gray-200 rounded" />
        <div className="h-4 w-full max-w-lg bg-gray-200 rounded" />
      </div>
      <div className="h-64 bg-gray-200 rounded-lg" />
    </div>
  );
}
