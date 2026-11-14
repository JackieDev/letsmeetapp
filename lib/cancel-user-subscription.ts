import { clerkClient } from "@clerk/nextjs/server";

const CANCELLABLE_STATUSES = new Set(["active", "past_due", "upcoming"]);

export type CancelUserSubscriptionResult =
  | {
      ok: true;
      changed: false;
    }
  | {
      ok: true;
      changed: true;
      isPaidSubscriber: boolean;
      billingSubscriptionId: string | null;
      billingPlanId: string | null;
      billingStatus: string;
      billingPeriodEnd: Date | null;
    }
  | { ok: false; error: string };

function toDate(value: number | Date | string | null | undefined): Date | null {
  if (value == null) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

/**
 * Cancel the member's paid Clerk subscription items.
 * `endNow` ends access immediately. Otherwise the current paid period continues.
 */
export async function cancelUserSubscription(
  userId: string,
  endNow: boolean
): Promise<CancelUserSubscriptionResult> {
  try {
    const client = await clerkClient();
    const subscription = await client.billing.getUserBillingSubscription(userId);
    const paidItems = subscription.subscriptionItems.filter((item) => {
      if (!CANCELLABLE_STATUSES.has(item.status)) return false;
      return item.plan?.slug !== "free_user";
    });

    if (paidItems.length === 0) {
      return { ok: true, changed: false };
    }

    let billingPeriodEnd: Date | null = null;
    let billingPlanId: string | null = null;

    for (const item of paidItems) {
      const canceled = await client.billing.cancelSubscriptionItem(item.id, { endNow });
      const periodEnd = endNow ? null : toDate(canceled.periodEnd ?? item.periodEnd);
      if (periodEnd && (!billingPeriodEnd || periodEnd > billingPeriodEnd)) {
        billingPeriodEnd = periodEnd;
      }
      billingPlanId = canceled.planId ?? canceled.plan?.id ?? item.planId ?? item.plan?.id ?? billingPlanId;
    }

    const keepsAccess = !endNow && billingPeriodEnd !== null && billingPeriodEnd > new Date();

    return {
      ok: true,
      changed: true,
      isPaidSubscriber: keepsAccess,
      billingSubscriptionId: subscription.id,
      billingPlanId,
      billingStatus: "canceled",
      billingPeriodEnd: keepsAccess ? billingPeriodEnd : null,
    };
  } catch (error) {
    if (isMissingSubscription(error)) {
      return { ok: true, changed: false };
    }
    const message = error instanceof Error ? error.message : "Could not update the subscription.";
    return { ok: false, error: message };
  }
}

function isMissingSubscription(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const status = "status" in error ? (error as { status?: unknown }).status : undefined;
  if (status === 404) return true;
  const message = error instanceof Error ? error.message.toLowerCase() : "";
  return message.includes("not found") || message.includes("no subscription");
}
