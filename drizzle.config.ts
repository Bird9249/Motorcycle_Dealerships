import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: ["./src/server/platform/db/schema"],
  out: "./src/server/platform/db/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL || "",
  },
});
