"use client";

import { useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export function BillingAuthGate({ children }: { children: React.ReactNode }) {
  const { isSignedIn, isLoaded } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoaded) return;
    if (!isSignedIn) {
      router.replace("/");
    }
  }, [isLoaded, isSignedIn, router]);

  if (!isLoaded) {
    return (
      <div className="container mx-auto flex max-w-screen-md items-center justify-center px-4 py-10">
        <p className="text-muted-foreground">Loading…</p>
      </div>
    );
  }

  if (!isSignedIn) {
    return null;
  }

  return children;
}
