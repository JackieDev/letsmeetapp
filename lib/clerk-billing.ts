import { clerkClient } from "@clerk/nextjs/server";
import { CLERK_BILLING_PLAN_ID, assertClerkBillingConfig } from "./billing-config";

export async function getUserHasActivePaidSubscription(userId: string) {
  assertClerkBillingConfig();

  const client = await clerkClient();
  const subscription = await client.billing.getUserBillingSubscription(userId);

  // Clerk returns subscription items for both free and paid plans; we only accept the paid Plan we configured.
  const paidItem = subscription.subscriptionItems?.find(
    (item) =>
      item.planId === CLERK_BILLING_PLAN_ID && item.status === "active"
  );

  return {
    isPaidSubscriber: Boolean(paidItem),
    subscription,
    paidItem,
  };
}

