"use client";

import { ClerkLoaded } from "@clerk/nextjs";
import Link from "next/link";
import { BillingPlanPicker } from "./BillingPlanPicker";

export function BillingCheckout() {
  return (
    <div className="flex flex-col gap-6">
      <ClerkLoaded>
        <BillingPlanPicker />
      </ClerkLoaded>

      <div className="text-sm text-muted-foreground">
        <Link href="/dashboard" className="underline underline-offset-4 hover:opacity-80">
          Back to dashboard
        </Link>
      </div>
    </div>
  );
}
