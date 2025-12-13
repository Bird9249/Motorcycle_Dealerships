import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: [
    "./src/server/platform/db/schema",
    "./src/server/modules/rbac/infra/db/rbac.schema.ts",
    "./src/server/modules/audit/infra/db/audit.schema.ts",
  ],
  out: "./src/server/platform/db/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL || "",
  },
});
