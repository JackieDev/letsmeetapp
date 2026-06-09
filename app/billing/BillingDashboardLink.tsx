"use client";

import { useState } from "react";

export function BillingDashboardLink() {
  const [isSyncing, setIsSyncing] = useState(false);

  async function handleClick(event: React.MouseEvent<HTMLAnchorElement>) {
    event.preventDefault();
    if (isSyncing) return;

    setIsSyncing(true);
    try {
      await fetch("/api/billing/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
        credentials: "same-origin",
      });
    } catch {
      // Still navigate — dashboard will retry sync.
    } finally {
      window.location.assign("/dashboard");
    }
  }

  return (
    <a
      href="/dashboard"
      onClick={(event) => void handleClick(event)}
      className="underline underline-offset-4 hover:opacity-80"
    >
      {isSyncing ? "Opening dashboard…" : "To dashboard"}
    </a>
  );
}
