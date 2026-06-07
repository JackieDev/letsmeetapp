"use client";

import { useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

/**
 * Modal sign-up/sign-in can finish without leaving `/`. Send signed-in users to
 * billing; that page forwards subscribers who are already paid to the dashboard.
 */
export function HomePostAuthRedirect() {
  const { isSignedIn, isLoaded } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoaded || !isSignedIn) return;
    router.replace("/billing");
  }, [isLoaded, isSignedIn, router]);

  return null;
}
