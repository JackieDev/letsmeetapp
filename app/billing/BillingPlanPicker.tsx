"use client";

import { SignedIn, SignedOut } from "@clerk/nextjs";
import { CheckoutButton, usePlans } from "@clerk/nextjs/experimental";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { syncMemberAfterPayment, provisionMemberAfterBillingSetup } from "@/actions/billing";
import {
  CLERK_BILLING_PLAN_ID,
  CLERK_BILLING_PLAN_PERIOD,
  CLERK_BILLING_PLAN_SLUG,
} from "@/lib/billing-config";

type BillingMoneyAmount = {
  amount: number;
  currency: string;
};

type BillingPlan = {
  id: string;
  name: string;
  description: string | null;
  slug: string;
  isDefault: boolean;
  hasBaseFee: boolean;
  publiclyVisible: boolean;
  fee: BillingMoneyAmount;
  annualFee: BillingMoneyAmount | null;
  annualMonthlyFee: BillingMoneyAmount | null;
};

const subscribeButtonClassName =
  "inline-flex h-11 w-full items-center justify-center rounded-md bg-primary px-8 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

function formatMoney(fee: BillingMoneyAmount): string {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: fee.currency.toUpperCase(),
  }).format(fee.amount / 100);
}

function getPlansFromQuery(data: unknown): BillingPlan[] {
  if (!data) return [];
  if (Array.isArray(data)) return data as BillingPlan[];
  if (
    typeof data === "object" &&
    data !== null &&
    "data" in data &&
    Array.isArray((data as { data: unknown }).data)
  ) {
    return (data as { data: BillingPlan[] }).data;
  }
  return [];
}

function isPaidPlan(plan: BillingPlan): boolean {
  return (
    plan.hasBaseFee &&
    !plan.isDefault &&
    plan.slug !== "free_user" &&
    (plan.annualFee !== null || plan.annualMonthlyFee !== null)
  );
}

function formatAnnualPrice(plan: BillingPlan): { amount: string; suffix: string } {
  if (plan.annualFee) {
    return { amount: formatMoney(plan.annualFee), suffix: "year" };
  }
  if (plan.annualMonthlyFee) {
    return {
      amount: formatMoney(plan.annualMonthlyFee),
      suffix: "month, billed annually",
    };
  }
  return { amount: formatMoney(plan.fee), suffix: "year" };
}

function matchesConfiguredPlan(plan: BillingPlan): boolean {
  if (CLERK_BILLING_PLAN_ID) return plan.id === CLERK_BILLING_PLAN_ID;
  if (CLERK_BILLING_PLAN_SLUG) return plan.slug === CLERK_BILLING_PLAN_SLUG;
  return true;
}

export function BillingPlanPicker() {
  const router = useRouter();
  const { data, isLoading, isError } = usePlans({ for: "user" });

  const plans = getPlansFromQuery(data).filter(
    (plan) => isPaidPlan(plan) && matchesConfiguredPlan(plan) && plan.publiclyVisible
  );

  if (isLoading) {
    return <p className="text-muted-foreground">Loading plans…</p>;
  }

  if (isError) {
    return (
      <p className="text-destructive">
        Could not load subscription plans. Check that Clerk Billing is enabled for this app.
      </p>
    );
  }

  if (plans.length === 0) {
    return (
      <p className="text-muted-foreground">
        No annual paid plans are available. Enable annual pricing on a user plan in Clerk Dashboard → Billing → Plans.
      </p>
    );
  }

  return (
    <ul className="flex flex-col gap-4">
      {plans.map((plan) => {
        const { amount: price, suffix: priceSuffix } = formatAnnualPrice(plan);

        return (
          <li
            key={plan.id}
            className="rounded-lg border border-border/40 bg-card p-6 text-card-foreground shadow-sm"
          >
            <h3 className="text-lg font-medium">{plan.name}</h3>
            {plan.description ? (
              <p className="text-muted-foreground mt-1 text-base">{plan.description}</p>
            ) : null}
            <p className="mt-3 text-2xl font-semibold">
              {price}
              <span className="ml-1 text-sm font-normal text-muted-foreground">
                / {priceSuffix}
              </span>
            </p>
            <div className="mt-6">
              <SignedIn>
                <CheckoutButton
                  for="user"
                  planId={plan.id}
                  planPeriod={CLERK_BILLING_PLAN_PERIOD}
                  onSubscriptionComplete={async () => {
                    await provisionMemberAfterBillingSetup();
                    const result = await syncMemberAfterPayment({ planId: plan.id });
                    if (!result.ok) {
                      const fallback = await fetch("/api/billing/sync", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ planId: plan.id }),
                        credentials: "same-origin",
                      });
                      if (!fallback.ok) return;
                    }
                    router.refresh();
                  }}
                >
                  <button type="button" className={subscribeButtonClassName}>
                    Subscribe to {plan.name}
                  </button>
                </CheckoutButton>
              </SignedIn>
              <SignedOut>
                <Link href="/" className={subscribeButtonClassName}>
                  Sign in to subscribe
                </Link>
              </SignedOut>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
