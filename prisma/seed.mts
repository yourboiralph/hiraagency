/**
 * Bootstraps the first admin account.
 * Run with: npm run db:seed
 *
 * Uses its own Prisma client because lib/db.ts is marked `server-only`
 * and cannot be imported outside the Next.js runtime.
 */
import { PrismaNeon } from "@prisma/adapter-neon";
import bcrypt from "bcryptjs";
import { config as loadEnv } from "dotenv";

import { PrismaClient } from "../lib/generated/prisma/client";

loadEnv({ path: ".env.local" });
loadEnv({ path: ".env" });

const BCRYPT_ROUNDS = 12;

async function main() {
  const email = process.env.SEED_ADMIN_EMAIL?.trim().toLowerCase();
  const name = process.env.SEED_ADMIN_NAME?.trim();
  const password = process.env.SEED_ADMIN_PASSWORD;

  if (!email || !name || !password) {
    throw new Error(
      "Missing SEED_ADMIN_EMAIL, SEED_ADMIN_NAME or SEED_ADMIN_PASSWORD. " +
        "Set them in .env.local before seeding.",
    );
  }

  if (password.length < 12) {
    throw new Error("SEED_ADMIN_PASSWORD must be at least 12 characters.");
  }

  const connectionString = process.env.DIRECT_URL ?? process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("Set DIRECT_URL (or DATABASE_URL) in .env.local first.");
  }

  const prisma = new PrismaClient({
    adapter: new PrismaNeon({ connectionString }),
  });

  try {
    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);

    const user = await prisma.user.upsert({
      where: { email },
      update: { role: "ADMIN", isActive: true },
      create: {
        email,
        name,
        passwordHash,
        role: "ADMIN",
        // The seeded admin picks their own password on first login.
        mustChangePassword: true,
      },
    });

    console.log(`Admin ready: ${user.email} (${user.id})`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
