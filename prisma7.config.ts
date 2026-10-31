import { config as loadEnv } from "dotenv";
import { defineConfig } from "prisma/config";

// Next.js reads `.env.local`; the Prisma CLI does not. Load both so
// `prisma migrate` and `prisma studio` see the same values the app does.
loadEnv({ path: ".env.local" });
loadEnv({ path: ".env" });

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.mts",
  },
  datasource: {
    // Migrations need an unpooled connection. Runtime queries use the
    // pooled DATABASE_URL through the driver adapter in lib/db.ts.
    url: process.env["DIRECT_URL"] ?? process.env["DATABASE_URL"],
  },
});
