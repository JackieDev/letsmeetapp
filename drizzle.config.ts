import { loadProductionEnv } from "./lib/load-production-env";
import { defineConfig } from "drizzle-kit";

loadProductionEnv();

export default defineConfig({
  out: './drizzle',
  schema: './db/schema.ts',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
