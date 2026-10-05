import "dotenv/config";
import { defineConfig } from "prisma/config";

// The Prisma CLI (migrate, studio, seed) prefers DIRECT_URL — a direct, non-pooled connection —
// because schema migrations shouldn't go through a transaction-mode pooler. The running app
// always uses DATABASE_URL (see src/lib/db.ts). Locally, DATABASE_URL alone is enough.
const url = process.env.DIRECT_URL || process.env.DATABASE_URL;

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    url: url ?? "",
  },
});
