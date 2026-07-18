import { NextResponse } from "next/server";
import { notifyPendingGroupApprovals } from "@/lib/notify-group-approvals";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function isCronAuthorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) return false;

  const authHeader = request.headers.get("authorization");
  return authHeader === `Bearer ${secret}`;
}

export async function GET(request: Request) {
  return runCron(request);
}

export async function POST(request: Request) {
  return runCron(request);
}

async function runCron(request: Request) {
  if (!isCronAuthorized(request)) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const result = await notifyPendingGroupApprovals();

  return NextResponse.json({
    ok: true,
    checkedAt: new Date().toISOString(),
    ...result,
  });
}
