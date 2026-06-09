import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { activateMemberSubscription } from "@/db/queries/billing";
import { getUserHasActivePaidSubscriptionWithRetry } from "@/lib/clerk-billing";
import { formatTrialEndDate } from "@/lib/free-trial";
import { getMemberAccessStatus } from "@/lib/member-access";
import { BillingAuthGate } from "./BillingAuthGate";
import { BillingCheckout } from "./BillingCheckout";

export const dynamic = "force-dynamic";

function BillingPageContent({ trialEndsAt }: { trialEndsAt: Date | null }) {
  return (
    <div className="container mx-auto max-w-screen-md flex flex-col gap-6 px-4 py-10">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Billing</h1>
        <p className="text-muted-foreground mt-2">
          {trialEndsAt
            ? `Your free trial ended on ${formatTrialEndDate(trialEndsAt)}. Subscribe annually to continue using the app.`
            : "Subscribe annually to continue using the app."}
        </p>
      </div>
      <BillingCheckout />
    </div>
  );
}

export default async function BillingPage() {
  const { userId } = await auth();
  let trialEndsAt: Date | null = null;

  if (userId) {
    const access = await getMemberAccessStatus(userId);
    const { member, isInFreeTrial, isPaidSubscriber } = access;
    trialEndsAt = access.trialEndsAt;

    if (isInFreeTrial) {
      redirect("/dashboard");
    }

    if (isPaidSubscriber || member.isPaidSubscriber) {
      redirect("/dashboard");
    }

    const billingCheck = await getUserHasActivePaidSubscriptionWithRetry(userId, 3);
    if (billingCheck.isPaidSubscriber && billingCheck.paidItem && billingCheck.subscription) {
      await activateMemberSubscription({
        userId,
        billingPlanId:
          billingCheck.paidItem.planId ?? billingCheck.paidItem.plan?.id ?? "",
        billingSubscriptionId: billingCheck.subscription.id,
        billingStatus: billingCheck.subscription.status,
        billingPeriodEnd: billingCheck.paidItem.periodEnd
          ? new Date(billingCheck.paidItem.periodEnd)
          : null,
      });
      redirect("/dashboard");
    }
  }

  return (
    <BillingAuthGate>
      <BillingPageContent trialEndsAt={trialEndsAt} />
    </BillingAuthGate>
  );
}
