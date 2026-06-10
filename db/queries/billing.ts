import { eq } from "drizzle-orm";
import { db } from "@/db";
import { membersTable } from "@/db/schema";
import { ensureMemberForUser } from "@/db/queries/members";

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

/** Ensures a members row exists, then marks the user as a paid subscriber. */
export async function activateMemberSubscription(params: {
  userId: string;
  email?: string | null;
  profilePicture?: string | null;
  signedUpAt?: Date | null;
  billingPlanId: string;
  billingCustomerId?: string | null;
  billingSubscriptionId?: string | null;
  billingStatus?: string | null;
  billingPeriodEnd?: Date | null;
}) {
  const {
    userId,
    email,
    profilePicture,
    signedUpAt,
    billingPlanId,
    billingCustomerId,
    billingSubscriptionId,
    billingStatus,
    billingPeriodEnd,
  } = params;

  await ensureMemberForUser({ userId, email, profilePicture, signedUpAt });

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
