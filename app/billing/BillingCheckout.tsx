"use client";

import { ClerkLoaded, PricingTable } from "@clerk/nextjs";
import { CheckoutButton } from "@clerk/nextjs/experimental";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { CLERK_BILLING_PLAN_ID, CLERK_BILLING_PLAN_PERIOD } from "@/lib/billing-config";

export function BillingCheckout() {
  return (
    <div className="flex flex-col gap-6">
      <ClerkLoaded>
        <div className="pointer-events-auto relative z-10 w-full">
          <PricingTable
            for="user"
            ctaPosition="bottom"
            newSubscriptionRedirectUrl="/dashboard"
          />
        </div>

        {CLERK_BILLING_PLAN_ID ? (
          <div className="rounded-lg border border-border/40 bg-card p-6 text-card-foreground shadow-sm">
            <h2 className="text-xl font-medium">Ready to subscribe?</h2>
            <p className="text-muted-foreground mt-2 text-base">
              If the plan above is not responding, use the button below to open checkout.
            </p>
            <div className="mt-6">
              <CheckoutButton
                for="user"
                planId={CLERK_BILLING_PLAN_ID}
                planPeriod={CLERK_BILLING_PLAN_PERIOD}
                newSubscriptionRedirectUrl="/dashboard"
              >
                <Button type="button" size="lg" className="w-full">
                  Subscribe now
                </Button>
              </CheckoutButton>
            </div>
          </div>
        ) : null}
      </ClerkLoaded>

      <div className="text-sm text-muted-foreground">
        <Link href="/dashboard" className="underline underline-offset-4 hover:opacity-80">
          Back to dashboard
        </Link>
      </div>
    </div>
  );
}
