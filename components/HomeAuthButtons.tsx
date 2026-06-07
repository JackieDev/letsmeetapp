"use client";

import { useAuth, useClerk } from "@clerk/nextjs";
import { useEffect, useRef } from "react";

const buttonClassName =
  "inline-flex h-10 items-center justify-center rounded-md bg-primary px-[1.65rem] text-[0.91875rem] font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50";

const signUpRedirectProps = {
  forceRedirectUrl: "/billing",
  fallbackRedirectUrl: "/billing",
  signInForceRedirectUrl: "/dashboard",
  signInFallbackRedirectUrl: "/dashboard",
} as const;

const signInRedirectProps = {
  forceRedirectUrl: "/dashboard",
  fallbackRedirectUrl: "/dashboard",
  signUpForceRedirectUrl: "/billing",
  signUpFallbackRedirectUrl: "/billing",
} as const;

export function HomeAuthButtons() {
  const { isSignedIn, isLoaded } = useAuth();
  const { openSignIn, openSignUp } = useClerk();
  const pendingRedirectRef = useRef<string | null>(null);

  useEffect(() => {
    if (!isLoaded || !isSignedIn || !pendingRedirectRef.current) return;

    const destination = pendingRedirectRef.current;
    pendingRedirectRef.current = null;
    window.location.assign(destination);
  }, [isLoaded, isSignedIn]);

  function handleSignUp() {
    pendingRedirectRef.current = "/billing";
    openSignUp(signUpRedirectProps);
  }

  function handleSignIn() {
    pendingRedirectRef.current = "/dashboard";
    openSignIn(signInRedirectProps);
  }

  return (
    <div className="flex flex-col gap-[0.504rem] sm:flex-row">
      <button type="button" className={buttonClassName} onClick={handleSignIn}>
        Sign In
      </button>
      <button type="button" className={buttonClassName} onClick={handleSignUp}>
        Sign Up
      </button>
    </div>
  );
}
