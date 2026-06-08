"use client";

import { useAuth, useClerk } from "@clerk/nextjs";
import { useEffect, useRef } from "react";

const buttonClassName =
  "inline-flex h-10 items-center justify-center rounded-md bg-primary px-[1.65rem] text-[0.91875rem] font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50";

const BILLING_PATH = "/billing";

const signUpRedirectProps = {
  forceRedirectUrl: BILLING_PATH,
  fallbackRedirectUrl: BILLING_PATH,
  signInForceRedirectUrl: BILLING_PATH,
  signInFallbackRedirectUrl: BILLING_PATH,
} as const;

const signInRedirectProps = {
  forceRedirectUrl: BILLING_PATH,
  fallbackRedirectUrl: BILLING_PATH,
  signUpForceRedirectUrl: BILLING_PATH,
  signUpFallbackRedirectUrl: BILLING_PATH,
} as const;

export function HomeAuthButtons() {
  const { isSignedIn, isLoaded } = useAuth();
  const { openSignIn, openSignUp } = useClerk();
  const pendingRedirectRef = useRef<string | null>(null);
  const hasRedirectedRef = useRef(false);

  useEffect(() => {
    if (!isLoaded || !isSignedIn || hasRedirectedRef.current) return;

    hasRedirectedRef.current = true;
    const destination = pendingRedirectRef.current ?? BILLING_PATH;
    pendingRedirectRef.current = null;
    window.location.assign(destination);
  }, [isLoaded, isSignedIn]);

  function handleSignUp() {
    hasRedirectedRef.current = false;
    pendingRedirectRef.current = BILLING_PATH;
    openSignUp(signUpRedirectProps);
  }

  function handleSignIn() {
    hasRedirectedRef.current = false;
    pendingRedirectRef.current = BILLING_PATH;
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
