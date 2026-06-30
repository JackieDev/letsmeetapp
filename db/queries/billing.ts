import { eq } from "drizzle-orm";
import { db } from "@/db";
import { membersTable } from "@/db/schema";
import { provisionMemberFromClerk } from "@/lib/provision-member";

export async function updateMemberBillingStatus(params: {
  userId: string;
  isPaidSubscriber: boolean;
  billingCustomerId?: string | null;
  billingSubscriptionId?: string | null;
  billingPlanId?: string | null;
  billingStatus?: string | null;
  billingPeriodEnd?: Date | null;
}) {
  const {
    userId,
    isPaidSubscriber,
    billingCustomerId,
    billingSubscriptionId,
    billingPlanId,
    billingStatus,
    billingPeriodEnd,
  } = params;

  await db
    .update(membersTable)
    .set({
      isPaidSubscriber,
      billingCustomerId: billingCustomerId ?? null,
      billingSubscriptionId: billingSubscriptionId ?? null,
      billingPlanId: billingPlanId ?? null,
      billingStatus: billingStatus ?? null,
      billingPeriodEnd: billingPeriodEnd ?? null,
    })
    .where(eq(membersTable.userId, userId));
}

/** Record billing setup on an existing member without marking them as paid. */
export async function recordMemberBillingSetup(params: {
  userId: string;
  billingPlanId?: string | null;
  billingSubscriptionId?: string | null;
  billingStatus?: string | null;
  billingPeriodEnd?: Date | null;
  billingCustomerId?: string | null;
}) {
  const {
    userId,
    billingPlanId,
    billingSubscriptionId,
    billingStatus,
    billingPeriodEnd,
    billingCustomerId,
  } = params;

  await db
    .update(membersTable)
    .set({
      billingPlanId: billingPlanId ?? null,
      billingSubscriptionId: billingSubscriptionId ?? null,
      billingStatus: billingStatus ?? null,
      billingPeriodEnd: billingPeriodEnd ?? null,
      billingCustomerId: billingCustomerId ?? null,
    })
    .where(eq(membersTable.userId, userId));
}

/** Ensures a members row exists, then marks the user as a paid subscriber. */
export async function activateMemberSubscription(params: {
  userId: string;
  billingPlanId: string;
  billingCustomerId?: string | null;
  billingSubscriptionId?: string | null;
  billingStatus?: string | null;
  billingPeriodEnd?: Date | null;
}) {
  const {
    userId,
    billingPlanId,
    billingCustomerId,
    billingSubscriptionId,
    billingStatus,
    billingPeriodEnd,
  } = params;

  await provisionMemberFromClerk(userId);

  await db
    .update(membersTable)
    .set({
      isPaidSubscriber: true,
      billingPlanId,
      billingCustomerId: billingCustomerId ?? null,
      billingSubscriptionId: billingSubscriptionId ?? null,
      billingStatus: billingStatus ?? "active",
      billingPeriodEnd: billingPeriodEnd ?? null,
    })
    .where(eq(membersTable.userId, userId));
}
