import { eq } from "drizzle-orm";
import { db } from "@/db";
import { membersTable } from "@/db/schema";

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

