// Copyright (c) 2026 Jérémy Vtipil
// Licensed under the GNU Affero General Public License v3.0

import { db } from "./db";
import { logger } from "./logger";
import bcrypt from "bcryptjs";

export class SignupError extends Error {
  constructor(message: string, public statusCode: number) {
    super(message);
  }
}

/**
 * Create a new tenant with an admin user.
 * Throws SignupError for business rule violations (email taken).
 */
export async function createTenantWithUser(data: {
  slug: string;
  name: string;
  email: string;
  password: string;
}) {
  // Check email availability
  const existingUser = await db.user.findUnique({
    where: { email: data.email },
    select: { id: true },
  });
  if (existingUser) {
    throw new SignupError("An account with this email already exists", 409);
  }

  const hashedPassword = await bcrypt.hash(data.password, 12);

  return db.$transaction(async (tx) => {
    const tenant = await tx.tenant.create({
      data: { slug: data.slug, name: data.name },
    });

    const user = await tx.user.create({
      data: {
        email: data.email,
        password: hashedPassword,
        name: data.name,
        tenantId: tenant.id,
        role: "ADMIN",
      },
    });

    logger.info("tenant_created", { tenantId: tenant.id, slug: data.slug });
    return { tenant, user };
  });
}
