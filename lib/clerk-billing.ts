import { clerkClient } from "@clerk/nextjs/server";
import { findActivePaidSubscriptionItem } from "./billing-config";

export async function getUserHasActivePaidSubscription(userId: string) {
  const client = await clerkClient();
  const subscription = await client.billing.getUserBillingSubscription(userId);

  const paidItem = findActivePaidSubscriptionItem(subscription.subscriptionItems);

  return {
    isPaidSubscriber: Boolean(paidItem),
    subscription,
    paidItem,
  };
}

const RETRY_DELAY_MS = 800;

export async function getUserHasActivePaidSubscriptionWithRetry(
  userId: string,
  attempts = 5
) {
  let lastResult = await getUserHasActivePaidSubscription(userId).catch(() => ({
    isPaidSubscriber: false,
    subscription: null,
    paidItem: null,
  }));

  for (let attempt = 1; attempt < attempts && !lastResult.isPaidSubscriber; attempt++) {
    await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
    lastResult = await getUserHasActivePaidSubscription(userId).catch(() => ({
      isPaidSubscriber: false,
      subscription: null,
      paidItem: null,
    }));
  }

  return lastResult;
}
