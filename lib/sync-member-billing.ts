import { currentUser } from "@clerk/nextjs/server";
import { activateMemberSubscription } from "@/db/queries/billing";
import { ensureMemberForUser } from "@/db/queries/members";
import { getUserHasActivePaidSubscriptionWithRetry } from "@/lib/clerk-billing";

export type SyncMemberBillingResult =
  | { ok: true; userId: string }
  | { ok: false; error: string };

export async function syncMemberBillingForUser(
  userId: string,
  planId?: string
): Promise<SyncMemberBillingResult> {
  try {
    const user = await currentUser();
    const email = user?.primaryEmailAddress?.emailAddress ?? null;
    const profilePicture = user?.imageUrl ?? null;

    await ensureMemberForUser({ userId, email, profilePicture });

    const billingCheck = await getUserHasActivePaidSubscriptionWithRetry(userId, 5);
    const { isPaidSubscriber, subscription, paidItem } = billingCheck;

    if (isPaidSubscriber && paidItem && subscription) {
      await activateMemberSubscription({
        userId,
        email,
        profilePicture,
        billingPlanId: paidItem.planId ?? paidItem.plan?.id ?? planId ?? "",
        billingSubscriptionId: subscription.id,
        billingStatus: subscription.status,
        billingPeriodEnd: paidItem.periodEnd ? new Date(paidItem.periodEnd) : null,
      });
      return { ok: true, userId };
    }

    if (planId) {
      await activateMemberSubscription({
        userId,
        email,
        profilePicture,
        billingPlanId: planId,
        billingStatus: "active",
      });
      return { ok: true, userId };
    }

    return { ok: false, error: "No active subscription found" };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to sync billing";
    return { ok: false, error: message };
  }
}
