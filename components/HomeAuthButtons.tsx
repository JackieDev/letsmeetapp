"use client";

import { SignInButton, SignUpButton } from "@clerk/nextjs";

const buttonClassName =
  "inline-flex h-10 shrink-0 cursor-pointer items-center justify-center rounded-md bg-primary px-[1.65rem] text-[0.91875rem] font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50";

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
  return (
    <div className="relative z-10 flex shrink-0 flex-col gap-[0.504rem] sm:flex-row">
      <SignInButton mode="modal" {...signInRedirectProps}>
        <button type="button" className={buttonClassName}>
          Sign In
        </button>
      </SignInButton>
      <SignUpButton mode="modal" {...signUpRedirectProps}>
        <button type="button" className={buttonClassName}>
          Sign Up
        </button>
      </SignUpButton>
    </div>
  );
}
