import { clerkClient } from "@clerk/nextjs/server";
import {
  assertClerkBillingConfig,
  matchesConfiguredPaidPlan,
} from "./billing-config";

export async function getUserHasActivePaidSubscription(userId: string) {
  assertClerkBillingConfig();

  const client = await clerkClient();
  const subscription = await client.billing.getUserBillingSubscription(userId);

  const paidItem = subscription.subscriptionItems?.find(matchesConfiguredPaidPlan);

  return {
    isPaidSubscriber: Boolean(paidItem),
    subscription,
    paidItem,
  };
}
