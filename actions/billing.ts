"use server";

import { auth, currentUser } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { updateMemberBillingStatus } from "@/db/queries/billing";
import { ensureMemberForUser } from "@/db/queries/members";
import { getUserHasActivePaidSubscription } from "@/lib/clerk-billing";

/** Called after Clerk checkout succeeds — ensures a members row exists and syncs billing fields. */
export async function syncMemberAfterPayment() {
  const { userId } = await auth();
  if (!userId) {
    throw new Error("Unauthorized");
  }

  const user = await currentUser();
  const email = user?.primaryEmailAddress?.emailAddress ?? null;
  const profilePicture = user?.imageUrl ?? null;

  await ensureMemberForUser({ userId, email, profilePicture });

  const billingCheck = await getUserHasActivePaidSubscription(userId).catch(() => ({
    isPaidSubscriber: false,
    subscription: null,
    paidItem: null,
  }));

  const { isPaidSubscriber, subscription, paidItem } = billingCheck;

  if (isPaidSubscriber && paidItem && subscription) {
    await updateMemberBillingStatus({
      userId,
      isPaidSubscriber: true,
      billingSubscriptionId: subscription.id,
      billingPlanId: paidItem.planId,
      billingStatus: subscription.status,
      billingPeriodEnd: paidItem.periodEnd ? new Date(paidItem.periodEnd) : null,
    });
  }

  revalidatePath("/dashboard");
  revalidatePath("/billing");
}
