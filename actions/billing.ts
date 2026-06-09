"use server";

import { auth, currentUser } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { updateMemberBillingStatus } from "@/db/queries/billing";
import { ensureMemberForUser } from "@/db/queries/members";
import { getUserHasActivePaidSubscriptionWithRetry } from "@/lib/clerk-billing";

const syncMemberAfterPaymentSchema = z.object({
  planId: z.string().min(1),
});

export type SyncMemberAfterPaymentInput = z.infer<typeof syncMemberAfterPaymentSchema>;

/** Called after Clerk checkout succeeds — ensures a members row exists and syncs billing fields. */
export async function syncMemberAfterPayment(input: SyncMemberAfterPaymentInput) {
  const { planId } = syncMemberAfterPaymentSchema.parse(input);

  const { userId } = await auth();
  if (!userId) {
    throw new Error("Unauthorized");
  }

  const user = await currentUser();
  const email = user?.primaryEmailAddress?.emailAddress ?? null;
  const profilePicture = user?.imageUrl ?? null;

  await ensureMemberForUser({ userId, email, profilePicture });

  const billingCheck = await getUserHasActivePaidSubscriptionWithRetry(userId);
  const { isPaidSubscriber, subscription, paidItem } = billingCheck;

  if (isPaidSubscriber && paidItem && subscription) {
    await updateMemberBillingStatus({
      userId,
      isPaidSubscriber: true,
      billingSubscriptionId: subscription.id,
      billingPlanId: paidItem.planId ?? planId,
      billingStatus: subscription.status,
      billingPeriodEnd: paidItem.periodEnd ? new Date(paidItem.periodEnd) : null,
    });
  } else {
    // Clerk may lag after checkout; trust the completed checkout plan so the user is not stuck on /billing.
    await updateMemberBillingStatus({
      userId,
      isPaidSubscriber: true,
      billingPlanId: planId,
      billingStatus: "active",
    });
  }

  revalidatePath("/dashboard");
  revalidatePath("/billing");
}
