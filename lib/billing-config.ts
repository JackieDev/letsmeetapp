export type ClerkBillingPlanPeriod = "month" | "annual";

function readPublicEnv(key: string): string | undefined {
  const raw = process.env[key];
  if (!raw || raw === "null" || raw === "undefined") return undefined;
  const trimmed = raw.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

export const CLERK_BILLING_PLAN_ID = readPublicEnv(
  "NEXT_PUBLIC_CLERK_BILLING_PLAN_ID"
);

/** Plan slug from Clerk Dashboard → Billing → Plans (User tab). Prefer this if plan IDs differ by environment. */
export const CLERK_BILLING_PLAN_SLUG = readPublicEnv(
  "NEXT_PUBLIC_CLERK_BILLING_PLAN_SLUG"
);

export const CLERK_BILLING_PLAN_PERIOD: ClerkBillingPlanPeriod =
  readPublicEnv("NEXT_PUBLIC_CLERK_BILLING_PLAN_PERIOD") === "annual"
    ? "annual"
    : "month";

type SubscriptionItemLike = {
  status?: string;
  planId?: string | null;
  plan?: { id?: string | null; slug?: string | null } | null;
};

export function matchesConfiguredPaidPlan(item: SubscriptionItemLike): boolean {
  if (item.status !== "active") return false;

  const planId = item.planId ?? item.plan?.id ?? undefined;
  const planSlug = item.plan?.slug ?? undefined;

  if (CLERK_BILLING_PLAN_ID && planId === CLERK_BILLING_PLAN_ID) return true;
  if (CLERK_BILLING_PLAN_SLUG && planSlug === CLERK_BILLING_PLAN_SLUG) return true;

  return false;
}

export function isBillingPlanConfigured(): boolean {
  return Boolean(CLERK_BILLING_PLAN_ID || CLERK_BILLING_PLAN_SLUG);
}

export function assertClerkBillingConfig() {
  if (!isBillingPlanConfigured()) {
    throw new Error(
      "Missing billing plan config. Set NEXT_PUBLIC_CLERK_BILLING_PLAN_ID and/or NEXT_PUBLIC_CLERK_BILLING_PLAN_SLUG."
    );
  }
}
