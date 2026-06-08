import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { ensureMemberForUser } from "@/db/queries/members";
import { getUserHasActivePaidSubscription } from "@/lib/clerk-billing";
import { BillingAuthGate } from "./BillingAuthGate";
import { BillingCheckout } from "./BillingCheckout";

export const dynamic = "force-dynamic";

function BillingPageContent() {
  return (
    <div className="container mx-auto max-w-screen-md flex flex-col gap-6 px-4 py-10">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Billing</h1>
        <p className="text-muted-foreground mt-2">
          Subscribe to continue using the app.
        </p>
      </div>
      <BillingCheckout />
    </div>
  );
}

export default async function BillingPage() {
  const { userId } = await auth();

  if (userId) {
    await ensureMemberForUser({
      userId,
      email: null,
      profilePicture: null,
    });

    const { isPaidSubscriber } = await getUserHasActivePaidSubscription(userId).catch(
      () => ({ isPaidSubscriber: false })
    );

    if (isPaidSubscriber) {
      redirect("/dashboard");
    }
  }

  return (
    <BillingAuthGate>
      <BillingPageContent />
    </BillingAuthGate>
  );
}
