"use client";

import { usePlans, useSubscription } from "@clerk/nextjs/experimental";
import { findActivePaidSubscriptionItem } from "@/lib/billing-config";
import { formatTrialEndDate } from "@/lib/free-trial";

type BillingPlan = {
  id: string;
  name: string;
  slug: string;
};

type Props = {
  billingStatus: string | null;
  billingPeriodEnd: string | null;
};

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

function formatStatus(status: string | null | undefined): string {
  if (!status) return "Active";
  return status.charAt(0).toUpperCase() + status.slice(1).replace(/_/g, " ");
}

function formatPeriodEnd(value: string | null | undefined): string | null {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return formatTrialEndDate(date);
}

export function BillingSubscriptionInfo({ billingStatus, billingPeriodEnd }: Props) {
  const { data: subscription, isLoading: isSubscriptionLoading } = useSubscription({ for: "user" });
  const { data: plansData, isLoading: isPlansLoading } = usePlans({ for: "user" });

  const isLoading = isSubscriptionLoading || isPlansLoading;

  const paidItem = findActivePaidSubscriptionItem(
    (subscription as { subscriptionItems?: unknown } | null | undefined)?.subscriptionItems as
      | Parameters<typeof findActivePaidSubscriptionItem>[0]
      | undefined
  );

  const plans = getPlansFromQuery(plansData);
  const planId = paidItem?.planId ?? paidItem?.plan?.id ?? null;
  const planName =
    plans.find((plan) => plan.id === planId)?.name ??
    paidItem?.plan?.slug?.replace(/_/g, " ") ??
    "Annual subscription";

  const status = paidItem?.status ?? billingStatus ?? "active";
  const periodEnd =
    formatPeriodEnd(
      paidItem?.periodEnd
        ? String(paidItem.periodEnd)
        : billingPeriodEnd
    ) ?? null;

  if (isLoading) {
    return (
      <div className="rounded-lg border border-border/40 bg-card p-6 text-card-foreground shadow-sm">
        <p className="text-muted-foreground">Loading subscription…</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border/40 bg-card p-6 text-card-foreground shadow-sm">
      <h2 className="text-lg font-medium">Your subscription</h2>
      <dl className="mt-4 grid gap-3 text-sm">
        <div className="flex flex-col gap-1 sm:flex-row sm:justify-between">
          <dt className="text-muted-foreground">Plan</dt>
          <dd className="font-medium">{planName}</dd>
        </div>
        <div className="flex flex-col gap-1 sm:flex-row sm:justify-between">
          <dt className="text-muted-foreground">Status</dt>
          <dd className="font-medium">{formatStatus(status)}</dd>
        </div>
        {periodEnd ? (
          <div className="flex flex-col gap-1 sm:flex-row sm:justify-between">
            <dt className="text-muted-foreground">Renews on</dt>
            <dd className="font-medium">{periodEnd}</dd>
          </div>
        ) : null}
      </dl>
    </div>
  );
}
