"use client";

import { ClerkLoaded } from "@clerk/nextjs";
import { BillingDashboardLink } from "./BillingDashboardLink";
import { BillingPlanPicker } from "./BillingPlanPicker";
import { BillingSubscriptionSync } from "./BillingSubscriptionSync";

type Props = {
  showPlanPicker: boolean;
};

export function BillingCheckout({ showPlanPicker }: Props) {
  return (
    <div className="flex flex-col gap-6">
      <ClerkLoaded>
        <BillingSubscriptionSync />
        {showPlanPicker ? <BillingPlanPicker /> : null}
      </ClerkLoaded>

      <div className="text-sm text-muted-foreground">
        <BillingDashboardLink />
      </div>
    </div>
  );
}
