import { NextResponse } from "next/server";
import { getEmailConfigDiagnostic } from "@/lib/email-diagnostic";
import { sendTestEmail } from "@/lib/email";
import { isDiagnosticsAuthorized } from "@/lib/diagnostics-auth";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  if (!(await isDiagnosticsAuthorized(request))) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.json({
    ok: true,
    checkedAt: new Date().toISOString(),
    ...getEmailConfigDiagnostic(),
  });
}

export async function POST(request: Request) {
  if (!(await isDiagnosticsAuthorized(request))) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const result = await sendTestEmail();

  return NextResponse.json({
    ok: result.ok,
    checkedAt: new Date().toISOString(),
    ...getEmailConfigDiagnostic(),
    testEmail: result,
  });
}
