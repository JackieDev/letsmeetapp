"use client";

import { SignInButton, SignUpButton } from "@clerk/nextjs";

const buttonClassName =
  "inline-flex h-10 shrink-0 cursor-pointer items-center justify-center rounded-md bg-primary px-[1.65rem] text-[0.91875rem] font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50";

const HOME_PATH = "/";
const SIGNED_UP_PATH = "/signed-up";

const signUpRedirectProps = {
  forceRedirectUrl: SIGNED_UP_PATH,
  fallbackRedirectUrl: SIGNED_UP_PATH,
  signInForceRedirectUrl: HOME_PATH,
  signInFallbackRedirectUrl: HOME_PATH,
} as const;

const signInRedirectProps = {
  forceRedirectUrl: HOME_PATH,
  fallbackRedirectUrl: HOME_PATH,
  signUpForceRedirectUrl: SIGNED_UP_PATH,
  signUpFallbackRedirectUrl: SIGNED_UP_PATH,
} as const;

export function HomeAuthButtons() {
  return (
    <div className="relative z-10 flex shrink-0 flex-col gap-[0.504rem] sm:flex-row">
      <SignUpButton mode="modal" {...signUpRedirectProps}>
        <button type="button" className={buttonClassName}>
          Sign Up
        </button>
      </SignUpButton>
      <SignInButton mode="modal" {...signInRedirectProps}>
        <button type="button" className={buttonClassName}>
          Sign In
        </button>
      </SignInButton>
    </div>
  );
}
