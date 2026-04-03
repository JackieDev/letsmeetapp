"use client";

import { SignedIn } from "@clerk/nextjs";
import { CheckoutButton } from "@clerk/nextjs/experimental";
import { CLERK_BILLING_PLAN_ID, CLERK_BILLING_PLAN_PERIOD } from "@/lib/billing-config";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export function BillingCheckout() {
  if (!CLERK_BILLING_PLAN_ID) {
    return (
      <div className="rounded-lg border border-border/40 bg-card p-6 text-card-foreground shadow-sm">
        <h2 className="text-xl font-medium">Billing not configured</h2>
        <p className="text-muted-foreground mt-2 text-base">
          Set <span className="font-mono">NEXT_PUBLIC_CLERK_BILLING_PLAN_ID</span> in your env.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border/40 bg-card p-6 text-card-foreground shadow-sm">
      <h2 className="text-xl font-medium">Subscribe</h2>
      <p className="text-muted-foreground mt-2 text-base">
        Start your subscription to unlock the full experience.
      </p>

      <div className="mt-6 flex items-center gap-3">
        <SignedIn>
          <CheckoutButton
            planId={CLERK_BILLING_PLAN_ID}
            planPeriod={CLERK_BILLING_PLAN_PERIOD}
            newSubscriptionRedirectUrl="/dashboard"
          >
            <Button className="w-full">Checkout</Button>
          </CheckoutButton>
        </SignedIn>
      </div>

      <div className="mt-5 text-sm text-muted-foreground">
        <Link href="/dashboard" className="underline underline-offset-4 hover:opacity-80">
          Back to dashboard
        </Link>
      </div>
    </div>
  );
}

