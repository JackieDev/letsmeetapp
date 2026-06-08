export const CLERK_BILLING_PLAN_ID = process.env
  .NEXT_PUBLIC_CLERK_BILLING_PLAN_ID as string | undefined;

export type ClerkBillingPlanPeriod = "month" | "annual";

export const CLERK_BILLING_PLAN_PERIOD: ClerkBillingPlanPeriod =
  process.env.NEXT_PUBLIC_CLERK_BILLING_PLAN_PERIOD === "annual"
    ? "annual"
    : "month";

export function assertClerkBillingConfig() {
  if (!CLERK_BILLING_PLAN_ID) {
    throw new Error(
      "Missing NEXT_PUBLIC_CLERK_BILLING_PLAN_ID (set it to your Clerk Billing Plan ID)."
    );
  }
}

