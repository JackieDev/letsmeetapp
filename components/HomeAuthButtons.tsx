"use client";

import {
  ClerkLoaded,
  ClerkLoading,
  SignInButton,
  SignUpButton,
} from "@clerk/nextjs";

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

function AuthButtonPlaceholder({ label }: { label: string }) {
  return (
    <button type="button" className={buttonClassName} disabled aria-busy="true">
      {label}
    </button>
  );
}

export function HomeAuthButtons() {
  return (
    <div className="relative z-10 flex flex-col gap-[0.504rem] sm:flex-row">
      <ClerkLoading>
        <AuthButtonPlaceholder label="Sign In" />
        <AuthButtonPlaceholder label="Sign Up" />
      </ClerkLoading>
      <ClerkLoaded>
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
      </ClerkLoaded>
    </div>
  );
}
