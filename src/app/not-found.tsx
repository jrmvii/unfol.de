// Copyright (c) 2026 Jérémy Vtipil
// Licensed under the GNU Affero General Public License v3.0

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-light text-gray-900">Site not found</h1>
        <p className="text-gray-400 font-light">
          This portfolio does not exist or has not been configured yet.
        </p>
        <a
          href="/"
          className="inline-block mt-4 text-sm text-gray-500 hover:text-gray-900 transition-colors"
        >
          &larr; Back to unfol.de
        </a>
      </div>
    </div>
  );
}
