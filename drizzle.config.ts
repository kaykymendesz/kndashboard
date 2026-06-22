import { defineConfig } from "drizzle-kit";
import "dotenv/config";
import { getDatabaseUrl } from "./src/lib/db/env";

export default defineConfig({
  schema: "./src/lib/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: getDatabaseUrl(),
  },
});
