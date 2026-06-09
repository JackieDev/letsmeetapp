"use client";

import { useAuth } from "@clerk/nextjs";

export function BillingAuthGate({ children }: { children: React.ReactNode }) {
  const { isSignedIn, isLoaded } = useAuth();

  if (!isLoaded) {
    return (
      <div className="container mx-auto flex max-w-screen-md items-center justify-center px-4 py-10">
        <p className="text-muted-foreground">Loading…</p>
      </div>
    );
  }

  if (!isSignedIn) {
    return (
      <div className="container mx-auto max-w-screen-md px-4 py-10">
        <p className="text-muted-foreground">
          Your session is still loading. Refresh the page, or sign in again from the home page.
        </p>
      </div>
    );
  }

  return children;
}
