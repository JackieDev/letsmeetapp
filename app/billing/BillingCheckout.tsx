"use client";

import { ClerkLoaded } from "@clerk/nextjs";
import { BillingDashboardLink } from "./BillingDashboardLink";
import { BillingPlanPicker } from "./BillingPlanPicker";
import { BillingSubscriptionSync } from "./BillingSubscriptionSync";

export function BillingCheckout() {
  return (
    <div className="flex flex-col gap-6">
      <ClerkLoaded>
        <BillingSubscriptionSync />
        <BillingPlanPicker />
      </ClerkLoaded>

      <div className="text-sm text-muted-foreground">
        <BillingDashboardLink />
      </div>
    </div>
  );
}
