import { config } from "dotenv";
import { resolve } from "node:path";

let loaded = false;

/**
 * Loads `.env.production` into `process.env` for keys not already set.
 * Next.js only auto-loads this file during production builds; local `next dev`
 * and drizzle-kit scripts need it explicitly for DATABASE_URL and other secrets.
 */
export function loadProductionEnv(): void {
  if (loaded) return;
  loaded = true;
  config({ path: resolve(process.cwd(), ".env.production") });
}
