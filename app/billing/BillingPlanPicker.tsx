"use client";

import { SignedIn } from "@clerk/nextjs";
import { CheckoutButton, usePlans } from "@clerk/nextjs/experimental";
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
  return plan.hasBaseFee && !plan.isDefault && plan.slug !== "free_user";
}

function matchesConfiguredPlan(plan: BillingPlan): boolean {
  if (CLERK_BILLING_PLAN_ID) return plan.id === CLERK_BILLING_PLAN_ID;
  if (CLERK_BILLING_PLAN_SLUG) return plan.slug === CLERK_BILLING_PLAN_SLUG;
  return true;
}

export function BillingPlanPicker() {
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
        No paid plans are available. Add a user plan in Clerk Dashboard → Billing → Plans.
      </p>
    );
  }

  return (
    <SignedIn>
      <ul className="flex flex-col gap-4">
        {plans.map((plan) => {
          const price =
            CLERK_BILLING_PLAN_PERIOD === "annual" && plan.annualMonthlyFee
              ? formatMoney(plan.annualMonthlyFee)
              : formatMoney(plan.fee);

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
                  / {CLERK_BILLING_PLAN_PERIOD === "annual" ? "month, billed annually" : "month"}
                </span>
              </p>
              <div className="mt-6">
                <CheckoutButton
                  for="user"
                  planId={plan.id}
                  planPeriod={CLERK_BILLING_PLAN_PERIOD}
                  newSubscriptionRedirectUrl="/dashboard"
                >
                  <button type="button" className={subscribeButtonClassName}>
                    Subscribe to {plan.name}
                  </button>
                </CheckoutButton>
              </div>
            </li>
          );
        })}
      </ul>
    </SignedIn>
  );
}
