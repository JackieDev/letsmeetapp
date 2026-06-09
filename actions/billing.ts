"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { syncMemberBillingForUser, type SyncMemberBillingResult } from "@/lib/sync-member-billing";

const syncMemberAfterPaymentSchema = z.object({
  planId: z.string().min(1),
});

export type SyncMemberAfterPaymentInput = z.infer<typeof syncMemberAfterPaymentSchema>;

export async function syncMemberAfterPayment(
  input: SyncMemberAfterPaymentInput
): Promise<SyncMemberBillingResult> {
  const { planId } = syncMemberAfterPaymentSchema.parse(input);

  const { userId } = await auth();
  if (!userId) {
    return { ok: false, error: "Unauthorized" };
  }

  const result = await syncMemberBillingForUser(userId, planId);

  if (result.ok) {
    revalidatePath("/dashboard");
    revalidatePath("/billing");
  }

  return result;
}
