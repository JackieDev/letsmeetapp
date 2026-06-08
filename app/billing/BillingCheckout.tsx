"use client";

import { PricingTable, SignedIn } from "@clerk/nextjs";
import Link from "next/link";

export function BillingCheckout() {
  return (
    <div className="rounded-lg border border-border/40 bg-card p-6 text-card-foreground shadow-sm">
      <h2 className="text-xl font-medium">Subscribe</h2>
      <p className="text-muted-foreground mt-2 text-base">
        Choose a plan to unlock the full experience.
      </p>

      <div className="mt-6">
        <SignedIn>
          <PricingTable newSubscriptionRedirectUrl="/dashboard" />
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
