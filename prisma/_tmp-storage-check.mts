import { PrismaNeon } from "@prisma/adapter-neon";
import bcrypt from "bcryptjs";
import { config as loadEnv } from "dotenv";

import { PrismaClient } from "../lib/generated/prisma/client";

loadEnv({ path: ".env.local" });
loadEnv({ path: ".env" });

const connectionString = process.env.DIRECT_URL ?? process.env.DATABASE_URL;
if (!connectionString) throw new Error("No database URL.");

const prisma = new PrismaClient({
  adapter: new PrismaNeon({ connectionString }),
});

try {
  const user = await prisma.user.upsert({
    where: { email: "storage-check@hiraagency.com" },
    update: { isActive: true, mustChangePassword: false, image: null },
    create: {
      email: "storage-check@hiraagency.com",
      name: "Storage Check",
      passwordHash: await bcrypt.hash("Storage-Check-2026!", 12),
      role: "ADMIN",
      isActive: true,
      mustChangePassword: false,
    },
  });

  console.log({ id: user.id, email: user.email });
} finally {
  await prisma.$disconnect();
}
