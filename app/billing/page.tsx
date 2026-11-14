import { auth } from "@clerk/nextjs/server";
import { tryActivateMemberFromClerkSubscription } from "@/lib/activate-member-from-clerk";
import { formatTrialEndDate } from "@/lib/free-trial";
import { getMemberAccessStatus } from "@/lib/member-access";
import { AccountActions } from "./AccountActions";
import { BillingCheckout } from "./BillingCheckout";
import { BillingSubscriptionInfo } from "./BillingSubscriptionInfo";
import { BillingTrialStatus } from "./BillingTrialStatus";

export const dynamic = "force-dynamic";

type BillingPageContentProps = {
  isSignedIn: boolean;
  isNewUser: boolean;
  isPaidSubscriber: boolean;
  isInFreeTrial: boolean;
  isPaused: boolean;
  isCanceled: boolean;
  trialEndsAt: string | null;
  billingStatus: string | null;
  billingPeriodEnd: string | null;
};

function BillingPageContent({
  isSignedIn,
  isNewUser,
  isPaidSubscriber,
  isInFreeTrial,
  isPaused,
  isCanceled,
  trialEndsAt,
  billingStatus,
  billingPeriodEnd,
}: BillingPageContentProps) {
  const showPlanPicker = !isPaidSubscriber;

  let description: string;
  if (!isSignedIn) {
    description = "View available subscription plans. Sign Up/Sign In to subscribe.";
  } else if (isPaused) {
    description = "Your account is paused. Resume it below, or delete it if you are done with LetsMeet.";
  } else if (isCanceled && !isPaidSubscriber) {
    description = "Your account is canceled. Subscribe to start again, or delete it below.";
  } else if (isPaidSubscriber) {
    description = "View your subscription details and manage billing.";
  } else if (isNewUser) {
    description =
      "Add your payment details to get started. Your first 6 months are free — you won't be charged until your trial ends.";
  } else if (isInFreeTrial && trialEndsAt) {
    description = `Your free trial is active until ${formatTrialEndDate(new Date(trialEndsAt))}. Subscribe now to keep access after your trial ends.`;
  } else if (trialEndsAt) {
    description = `Your free trial ended on ${formatTrialEndDate(new Date(trialEndsAt))}. Subscribe annually to continue using the app.`;
  } else {
    description = "Subscribe annually to continue using the app.";
  }

  return (
    <div className="container mx-auto max-w-screen-md flex flex-col gap-6 px-4 py-10">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Billing</h1>
        <p className="text-muted-foreground mt-2">{description}</p>
      </div>

      {isPaidSubscriber ? (
        <BillingSubscriptionInfo
          billingStatus={billingStatus}
          billingPeriodEnd={billingPeriodEnd}
        />
      ) : null}

      {isInFreeTrial && !isPaidSubscriber && !isCanceled && trialEndsAt ? (
        <BillingTrialStatus trialEndsAt={trialEndsAt} />
      ) : null}

      {isSignedIn ? (
        <AccountActions
          isPaused={isPaused}
          isCanceled={isCanceled}
          isPaidSubscriber={isPaidSubscriber}
          isInFreeTrial={isInFreeTrial && !isCanceled}
          billingPeriodEnd={billingPeriodEnd}
        />
      ) : null}

      <BillingCheckout showPlanPicker={showPlanPicker} />
    </div>
  );
}

export default async function BillingPage() {
  const { userId } = await auth();
  const isSignedIn = Boolean(userId);

  let isNewUser = false;
  let isPaidSubscriber = false;
  let isInFreeTrial = false;
  let isPaused = false;
  let isCanceled = false;
  let trialEndsAt: string | null = null;
  let billingStatus: string | null = null;
  let billingPeriodEnd: string | null = null;

  if (userId) {
    let access = await getMemberAccessStatus(userId);

    if (!access.isPaused && !access.isCanceled && (!access.hasAccess || access.isPaidSubscriber)) {
      const synced = await tryActivateMemberFromClerkSubscription(userId);
      if (synced) {
        access = await getMemberAccessStatus(userId);
      }
    }

    isNewUser = !access.hasCompletedBillingSetup;
    isPaidSubscriber = access.isPaidSubscriber;
    isInFreeTrial = access.isInFreeTrial;
    isPaused = access.isPaused;
    isCanceled = access.isCanceled;
    trialEndsAt = access.trialEndsAt?.toISOString() ?? null;
    billingStatus = access.member?.billingStatus ?? null;
    billingPeriodEnd = access.member?.billingPeriodEnd
      ? new Date(access.member.billingPeriodEnd).toISOString()
      : null;
  }

  return (
    <BillingPageContent
      isSignedIn={isSignedIn}
      isNewUser={isNewUser}
      isPaidSubscriber={isPaidSubscriber}
      isInFreeTrial={isInFreeTrial}
      isPaused={isPaused}
      isCanceled={isCanceled}
      trialEndsAt={trialEndsAt}
      billingStatus={billingStatus}
      billingPeriodEnd={billingPeriodEnd}
    />
  );
}
