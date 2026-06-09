import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { z } from "zod";
import { syncMemberBillingForUser } from "@/lib/sync-member-billing";

const bodySchema = z.object({
  planId: z.string().min(1).optional(),
});

export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  let planId: string | undefined;
  try {
    const json: unknown = await request.json();
    const parsed = bodySchema.parse(json);
    planId = parsed.planId;
  } catch {
    planId = undefined;
  }

  const result = await syncMemberBillingForUser(userId, planId);

  if (result.ok) {
    revalidatePath("/dashboard");
    revalidatePath("/billing");
    return NextResponse.json(result);
  }

  return NextResponse.json(result, { status: 400 });
}
