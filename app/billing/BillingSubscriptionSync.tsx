"use client";

import { useAuth } from "@clerk/nextjs";
import { useSubscription } from "@clerk/nextjs/experimental";
import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";

function getActivePaidPlanId(subscription: unknown): string | null {
  if (!subscription || typeof subscription !== "object") return null;

  const items = (subscription as { subscriptionItems?: unknown }).subscriptionItems;
  if (!Array.isArray(items)) return null;

  for (const item of items) {
    if (!item || typeof item !== "object") continue;
    const record = item as {
      status?: string;
      planId?: string;
      plan?: { id?: string; slug?: string };
    };
    if (record.status !== "active") continue;
    if (record.plan?.slug === "free_user") continue;

    const planId = record.planId ?? record.plan?.id;
    if (planId) return planId;
  }

  return null;
}

export function BillingSubscriptionSync() {
  const { isSignedIn, isLoaded } = useAuth();
  const { data: subscription, isLoading } = useSubscription({ for: "user" });
  const router = useRouter();
  const syncedRef = useRef(false);

  useEffect(() => {
    if (!isLoaded || !isSignedIn || isLoading || syncedRef.current) return;

    const planId = getActivePaidPlanId(subscription);
    if (!planId) return;

    syncedRef.current = true;

    void fetch("/api/billing/sync", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ planId }),
      credentials: "same-origin",
    })
      .then(async (response) => {
        if (!response.ok) {
          syncedRef.current = false;
          return;
        }
        router.replace("/dashboard");
      })
      .catch(() => {
        syncedRef.current = false;
      });
  }, [isLoaded, isSignedIn, isLoading, subscription, router]);

  return null;
}
