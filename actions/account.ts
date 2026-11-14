"use server";

import { auth, clerkClient } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import {
  deleteMemberAccountData,
  setMemberAccountCanceled,
  setMemberAccountPaused,
} from "@/db/queries/account";
import { updateMemberBillingStatus } from "@/db/queries/billing";
import { getMemberByUserId } from "@/db/queries/members";
import { cancelUserSubscription } from "@/lib/cancel-user-subscription";
import { provisionMemberFromClerk } from "@/lib/provision-member";

export type AccountActionResult = { ok: true } | { ok: false; error: string };

function revalidateAccountPaths() {
  revalidatePath("/billing");
  revalidatePath("/dashboard");
  revalidatePath("/");
  revalidatePath("/groups");
  revalidatePath("/calendar");
}

async function applySubscriptionCancel(
  userId: string,
  endNow: boolean
): Promise<AccountActionResult> {
  const canceled = await cancelUserSubscription(userId, endNow);
  if (!canceled.ok) return canceled;
  if (!canceled.changed) return { ok: true };

  const member = await getMemberByUserId(userId);
  await updateMemberBillingStatus({
    userId,
    isPaidSubscriber: canceled.isPaidSubscriber,
    billingCustomerId: member?.billingCustomerId ?? null,
    billingSubscriptionId: canceled.billingSubscriptionId,
    billingPlanId: canceled.billingPlanId,
    billingStatus: canceled.billingStatus,
    billingPeriodEnd: canceled.billingPeriodEnd,
  });

  return { ok: true };
}

export async function pauseAccount(): Promise<AccountActionResult> {
  const { userId } = await auth();
  if (!userId) return { ok: false, error: "You must be signed in." };

  try {
    await provisionMemberFromClerk(userId);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not load your account.";
    return { ok: false, error: message };
  }

  const canceled = await applySubscriptionCancel(userId, false);
  if (!canceled.ok) return canceled;

  await setMemberAccountPaused(userId, true);
  revalidateAccountPaths();
  return { ok: true };
}

export async function resumeAccount(): Promise<AccountActionResult> {
  const { userId } = await auth();
  if (!userId) return { ok: false, error: "You must be signed in." };

  await setMemberAccountPaused(userId, false);
  revalidateAccountPaths();
  return { ok: true };
}

export async function cancelAccount(): Promise<AccountActionResult> {
  const { userId } = await auth();
  if (!userId) return { ok: false, error: "You must be signed in." };

  try {
    await provisionMemberFromClerk(userId);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not load your account.";
    return { ok: false, error: message };
  }

  const canceled = await applySubscriptionCancel(userId, false);
  if (!canceled.ok) return canceled;

  await setMemberAccountCanceled(userId);
  revalidateAccountPaths();
  return { ok: true };
}

const deleteAccountSchema = z.object({
  confirmation: z.literal("delete"),
});

export type DeleteAccountInput = z.infer<typeof deleteAccountSchema>;

export async function deleteAccount(input: DeleteAccountInput): Promise<AccountActionResult> {
  const parsed = deleteAccountSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Type delete to confirm." };
  }

  const { userId } = await auth();
  if (!userId) return { ok: false, error: "You must be signed in." };

  const canceled = await applySubscriptionCancel(userId, true);
  if (!canceled.ok) return canceled;

  await deleteMemberAccountData(userId);

  try {
    const client = await clerkClient();
    await client.users.deleteUser(userId);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not delete the sign-in account.";
    return {
      ok: false,
      error: `Your LetsMeet data was removed, but the sign-in account could not be deleted. ${message}`,
    };
  }

  revalidateAccountPaths();
  return { ok: true };
}
