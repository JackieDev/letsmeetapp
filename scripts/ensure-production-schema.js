/**
 * Apply idempotent production schema fixes during Amplify build.
 * Uses direct SQL (not drizzle-kit migrate) so it is safe when the DB was
 * originally provisioned with db:push and __drizzle_migrations is empty or stale.
 */
const fs = require("fs");
const path = require("path");
const { neon } = require("@neondatabase/serverless");

const envPath = path.join(process.cwd(), ".env.production");
if (!fs.existsSync(envPath)) {
  console.error("ensure-production-schema: .env.production not found; skipping");
  process.exit(0);
}

process.env.DOTENV_CONFIG_PATH = envPath;
require("dotenv/config");

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error("ensure-production-schema: DATABASE_URL missing; skipping");
  process.exit(0);
}

const sqlFiles = [
  "drizzle/0008_notifications.sql",
  "drizzle/0009_members_signed_up_at.sql",
  "drizzle/0010_ensure_members_schema.sql",
];

function splitStatements(contents) {
  return contents
    .split(/--> statement-breakpoint/g)
    .map((s) => s.trim())
    .filter((s) => s.length > 0 && !s.startsWith("--"));
}

async function main() {
  try {
    const host = new URL(databaseUrl).hostname;
    console.log(`ensure-production-schema: connecting to host=${host}`);
  } catch {
    console.log("ensure-production-schema: connecting (host unknown)");
  }

  const sql = neon(databaseUrl);

  for (const relativePath of sqlFiles) {
    const filePath = path.join(process.cwd(), relativePath);
    if (!fs.existsSync(filePath)) {
      console.warn(`ensure-production-schema: skipping missing file ${relativePath}`);
      continue;
    }

    const statements = splitStatements(fs.readFileSync(filePath, "utf8"));
    console.log(`ensure-production-schema: ${relativePath} (${statements.length} statements)`);

    for (const statement of statements) {
      await sql(statement);
    }
  }

  console.log("ensure-production-schema: done");
}

main().catch((error) => {
  console.error("ensure-production-schema: failed", error);
  process.exit(1);
});
