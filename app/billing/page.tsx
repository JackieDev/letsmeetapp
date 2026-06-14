import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { tryActivateMemberFromClerkSubscription } from "@/lib/activate-member-from-clerk";
import { formatTrialEndDate } from "@/lib/free-trial";
import { getMemberAccessStatus } from "@/lib/member-access";
import { BillingAuthGate } from "./BillingAuthGate";
import { BillingCheckout } from "./BillingCheckout";

export const dynamic = "force-dynamic";

function BillingPageContent({
  trialEndsAt,
  isNewUser,
}: {
  trialEndsAt: Date | null;
  isNewUser: boolean;
}) {
  return (
    <div className="container mx-auto max-w-screen-md flex flex-col gap-6 px-4 py-10">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Billing</h1>
        <p className="text-muted-foreground mt-2">
          {isNewUser
            ? "Add your payment details to get started. Your first 6 months are free — you won't be charged until your trial ends."
            : trialEndsAt
              ? `Your free trial ended on ${formatTrialEndDate(trialEndsAt)}. Subscribe annually to continue using the app.`
              : "Subscribe annually to continue using the app."}
        </p>
      </div>
      <BillingCheckout />
    </div>
  );
}

export default async function BillingPage() {
  const { userId } = await auth.protect();

  let access = await getMemberAccessStatus(userId);

  if (!access.hasAccess) {
    const synced = await tryActivateMemberFromClerkSubscription(userId);
    if (synced) {
      access = await getMemberAccessStatus(userId);
    }
  }

  if (access.hasAccess) {
    redirect("/dashboard");
  }

  const isNewUser = !access.hasCompletedBillingSetup;

  return (
    <BillingAuthGate>
      <BillingPageContent trialEndsAt={access.trialEndsAt} isNewUser={isNewUser} />
    </BillingAuthGate>
  );
}
