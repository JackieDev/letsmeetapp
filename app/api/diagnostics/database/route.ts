import { sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { getDatabaseConnectionDiagnostic } from "@/lib/database-url-diagnostic";
import { isDiagnosticsAuthorized } from "@/lib/diagnostics-auth";
import { getDatabaseUrlSource } from "@/lib/server-secrets";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  if (!(await isDiagnosticsAuthorized(request))) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const urlSource = process.env.DATABASE_URL
    ? getDatabaseUrlSource()
    : ("missing" as const);

  const diagnostic = getDatabaseConnectionDiagnostic(urlSource);

  if (diagnostic.configured) {
    try {
      const result = await db.execute(sql`SELECT current_database() AS database_name`);
      const rows = Array.isArray(result) ? result : result.rows;
      const row = rows[0] as { database_name?: string } | undefined;
      diagnostic.liveConnection = {
        ok: true,
        databaseName: row?.database_name,
      };
    } catch (error) {
      diagnostic.liveConnection = {
        ok: false,
        error: error instanceof Error ? error.message : "Connection failed",
      };
    }
  }

  return NextResponse.json({
    ok: true,
    checkedAt: new Date().toISOString(),
    ...diagnostic,
  });
}
