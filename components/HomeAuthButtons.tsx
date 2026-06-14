"use client";

import { useClerk } from "@clerk/nextjs";

const buttonClassName =
  "inline-flex h-10 items-center justify-center rounded-md bg-primary px-[1.65rem] text-[0.91875rem] font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50";

const BILLING_PATH = "/billing";
const SIGNED_UP_PATH = "/signed-up";

const signUpRedirectProps = {
  forceRedirectUrl: SIGNED_UP_PATH,
  fallbackRedirectUrl: SIGNED_UP_PATH,
  signInForceRedirectUrl: BILLING_PATH,
  signInFallbackRedirectUrl: BILLING_PATH,
} as const;

const signInRedirectProps = {
  forceRedirectUrl: BILLING_PATH,
  fallbackRedirectUrl: BILLING_PATH,
  signUpForceRedirectUrl: SIGNED_UP_PATH,
  signUpFallbackRedirectUrl: SIGNED_UP_PATH,
} as const;

export function HomeAuthButtons() {
  const { openSignIn, openSignUp } = useClerk();

  return (
    <div className="flex flex-col gap-[0.504rem] sm:flex-row">
      <button type="button" className={buttonClassName} onClick={() => openSignIn(signInRedirectProps)}>
        Sign In
      </button>
      <button type="button" className={buttonClassName} onClick={() => openSignUp(signUpRedirectProps)}>
        Sign Up
      </button>
    </div>
  );
}
