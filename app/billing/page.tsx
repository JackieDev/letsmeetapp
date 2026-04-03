import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { ensureMemberForUser } from "@/db/queries/members";
import { getUserHasActivePaidSubscription } from "@/lib/clerk-billing";
import { BillingCheckout } from "./BillingCheckout";

export default async function BillingPage() {
  const { userId } = await auth();
  if (!userId) redirect("/");

  // Ensure we have a row in our DB so webhook updates have a target.
  await ensureMemberForUser({
    userId,
    email: null,
    profilePicture: null,
  });

  // If they're already paid, send them to the dashboard.
  const { isPaidSubscriber } = await getUserHasActivePaidSubscription(userId).catch(
    () => ({ isPaidSubscriber: false })
  );

  if (isPaidSubscriber) redirect("/dashboard");

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

