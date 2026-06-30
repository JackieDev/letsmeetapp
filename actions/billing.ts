"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { provisionMemberFromClerk } from "@/lib/provision-member";
import { syncMemberBillingForUser, type SyncMemberBillingResult } from "@/lib/sync-member-billing";

const syncMemberAfterPaymentSchema = z.object({
  planId: z.string().min(1),
});

export type SyncMemberAfterPaymentInput = z.infer<typeof syncMemberAfterPaymentSchema>;

export type ProvisionMemberResult =
  | { ok: true; userId: string }
  | { ok: false; error: string };

export async function provisionMemberAfterBillingSetup(): Promise<ProvisionMemberResult> {
  const { userId } = await auth();
  if (!userId) {
    return { ok: false, error: "Unauthorized" };
  }

  try {
    await provisionMemberFromClerk(userId);
    revalidatePath("/dashboard");
    revalidatePath("/billing");
    return { ok: true, userId };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to provision member";
    return { ok: false, error: message };
  }
}

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
