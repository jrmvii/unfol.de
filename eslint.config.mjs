// Copyright (c) 2026 Jérémy Vtipil
// Licensed under the GNU Affero General Public License v3.0

import nextConfig from "eslint-config-next";

export default [
  ...nextConfig,
  {
    ignores: ["node_modules/", ".next/", "prisma/", "e2e/"],
  },
];
