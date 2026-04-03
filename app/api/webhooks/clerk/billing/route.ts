import { verifyWebhook } from "@clerk/backend/webhooks";
import { NextResponse } from "next/server";
import { ensureMemberForUser } from "@/db/queries/members";
import { updateMemberBillingStatus } from "@/db/queries/billing";
import {
  CLERK_BILLING_PLAN_ID,
  // assertClerkBillingConfig,
} from "@/lib/billing-config";

export const runtime = "nodejs";

function parseDateOrNull(value: unknown): Date | null {
  if (!value) return null;
  if (value instanceof Date) return value;
  if (typeof value === "number") return new Date(value);
  if (typeof value === "string") {
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  return null;
}

function extractFirstAvailable(...values: Array<unknown>): string | null {
  for (const v of values) {
    if (typeof v === "string" && v.length > 0) return v;
  }
  return null;
}

export async function POST(request: Request) {
  // If billing isn't configured, just acknowledge webhooks.
  if (!CLERK_BILLING_PLAN_ID) {
    return NextResponse.json({ received: true, ignored: true });
  }

  let evt: unknown;
  try {
    evt = await verifyWebhook(request);
  } catch (err) {
    console.error("Clerk webhook verification failed:", err);
    return NextResponse.json(
      { received: false, error: "invalid webhook signature" },
      { status: 400 }
    );
  }

  type UnknownRecord = Record<string, unknown>;
  const eventType: string | undefined = (evt as { type?: string })?.type;
  const dataCandidate: unknown = (evt as { data?: unknown })?.data;
  const data: UnknownRecord =
    dataCandidate && typeof dataCandidate === "object" ? (dataCandidate as UnknownRecord) : {};

  const payer: UnknownRecord =
    data.payer && typeof data.payer === "object" && data.payer !== null
      ? (data.payer as UnknownRecord)
      : {};
  const plan: UnknownRecord =
    data.plan && typeof data.plan === "object" && data.plan !== null
      ? (data.plan as UnknownRecord)
      : {};
  const subscriptionItem: UnknownRecord =
    data.subscriptionItem && typeof data.subscriptionItem === "object" && data.subscriptionItem !== null
      ? (data.subscriptionItem as UnknownRecord)
      : {};
  const subscription: UnknownRecord =
    data.subscription && typeof data.subscription === "object" && data.subscription !== null
      ? (data.subscription as UnknownRecord)
      : {};

  // Payer is the user (B2C) who owns the subscription item.
  const payerId = extractFirstAvailable(
    data.payerId,
    payer.id,
    payer.user_id,
    payer.userId
  );

  // Subscription item / plan info.
  const planId = extractFirstAvailable(
    data.planId,
    plan.id,
    subscriptionItem.planId,
    (subscriptionItem.plan && typeof subscriptionItem.plan === "object"
      ? (subscriptionItem.plan as UnknownRecord).id
      : null)
  );

  const billingSubscriptionId = extractFirstAvailable(
    data.subscriptionId,
    subscription.id,
    subscription.subscriptionId
  );

  const billingPeriodEnd = parseDateOrNull(
    data.periodEnd ?? data.period_end ?? subscriptionItem.periodEnd
  );

  const now = new Date();

  let nextIsPaidSubscriber: boolean | null = null;
  let nextBillingStatus: string | null = null;

  // Only react to events for the plan we charge for.
  if (eventType?.startsWith("subscriptionItem.")) {
    const base = eventType.replace("subscriptionItem.", "");

    if (planId === CLERK_BILLING_PLAN_ID) {
      switch (eventType) {
        case "subscriptionItem.active": {
          nextIsPaidSubscriber = true;
          nextBillingStatus = "active";
          break;
        }
        case "subscriptionItem.canceled": {
          // User keeps features until end of current period.
          nextIsPaidSubscriber =
            billingPeriodEnd !== null && billingPeriodEnd > now;
          nextBillingStatus = "canceled";
          break;
        }
        case "subscriptionItem.pastDue":
        case "subscriptionItem.ended":
        case "subscriptionItem.abandoned":
        case "subscriptionItem.incomplete":
          nextIsPaidSubscriber = false;
          nextBillingStatus = base;
          break;
        case "subscriptionItem.upcoming":
          // Upcoming paid plan changes aren't active yet.
          nextIsPaidSubscriber = false;
          nextBillingStatus = base;
          break;
        default:
          break;
      }
    }
  }

  if (!payerId || nextIsPaidSubscriber === null) {
    return NextResponse.json({ received: true, ignored: true });
  }

  // Ensure we have a target row, then update subscription state.
  await ensureMemberForUser({ userId: payerId, email: null, profilePicture: null });

  await updateMemberBillingStatus({
    userId: payerId,
    isPaidSubscriber: nextIsPaidSubscriber,
    billingSubscriptionId,
    billingPlanId: planId ?? null,
    billingStatus: nextBillingStatus,
    billingPeriodEnd,
    // billingCustomerId: optional (depends on webhook payload)
  });

  return NextResponse.json({ received: true });
}

