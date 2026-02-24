// Copyright (c) 2026 Jérémy Vtipil
// Licensed under the GNU Affero General Public License v3.0

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const db = new PrismaClient();

async function main() {
  const slug = process.env.TENANT_SLUG || "my-portfolio";
  const name = process.env.TENANT_NAME || slug;
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;

  if (!email || !password) {
    console.error(
      "Set ADMIN_EMAIL and ADMIN_PASSWORD environment variables to seed the database."
    );
    process.exit(1);
  }

  // Check if tenant already exists
  const existing = await db.tenant.findUnique({ where: { slug } });
  if (existing) {
    console.log(`Tenant "${slug}" already exists. Skipping seed.`);
    return;
  }

  const hashedPassword = await bcrypt.hash(password, 12);

  const tenant = await db.tenant.create({
    data: { slug, name },
  });

  await db.user.create({
    data: {
      email,
      password: hashedPassword,
      name,
      tenantId: tenant.id,
      role: "ADMIN",
      emailVerified: true,
    },
  });

  console.log(`Created tenant "${slug}" with admin user ${email}`);
  console.log(`Login at /admin/login`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
