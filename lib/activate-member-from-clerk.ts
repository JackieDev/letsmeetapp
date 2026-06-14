import { activateMemberSubscription } from "@/db/queries/billing";
import { getUserHasActivePaidSubscriptionWithRetry } from "@/lib/clerk-billing";
import { getClerkUserDetails } from "@/lib/clerk-user";

export async function tryActivateMemberFromClerkSubscription(
  userId: string
): Promise<boolean> {
  const billingCheck = await getUserHasActivePaidSubscriptionWithRetry(userId, 3);
  const { isPaidSubscriber, subscription, paidItem } = billingCheck;

  if (!isPaidSubscriber || !paidItem || !subscription) {
    return false;
  }

  const clerkDetails = await getClerkUserDetails(userId);
  await activateMemberSubscription({
    userId,
    email: clerkDetails.email,
    profilePicture: clerkDetails.profilePicture,
    signedUpAt: clerkDetails.signedUpAt,
    billingPlanId: paidItem.planId ?? paidItem.plan?.id ?? "",
    billingSubscriptionId: subscription.id,
    billingStatus: subscription.status,
    billingPeriodEnd: paidItem.periodEnd ? new Date(paidItem.periodEnd) : null,
  });

  return true;
}
