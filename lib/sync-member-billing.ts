import { activateMemberSubscription, recordMemberBillingSetup } from "@/db/queries/billing";
import { getUserHasActivePaidSubscriptionWithRetry } from "@/lib/clerk-billing";
import { provisionMemberFromClerk } from "@/lib/provision-member";

export type SyncMemberBillingResult =
  | { ok: true; userId: string }
  | { ok: false; error: string };

export async function syncMemberBillingForUser(
  userId: string,
  planId?: string
): Promise<SyncMemberBillingResult> {
  try {
    await provisionMemberFromClerk(userId);

    const billingCheck = await getUserHasActivePaidSubscriptionWithRetry(userId, 5);
    const { isPaidSubscriber, subscription, paidItem } = billingCheck;

    if (isPaidSubscriber && paidItem && subscription) {
      await activateMemberSubscription({
        userId,
        billingPlanId: paidItem.planId ?? paidItem.plan?.id ?? planId ?? "",
        billingSubscriptionId: subscription.id,
        billingStatus: subscription.status,
        billingPeriodEnd: paidItem.periodEnd ? new Date(paidItem.periodEnd) : null,
      });
      return { ok: true, userId };
    }

    if (planId) {
      await recordMemberBillingSetup({
        userId,
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
