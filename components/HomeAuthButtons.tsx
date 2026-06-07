"use client";

import { SignInButton, SignUpButton } from "@clerk/nextjs";

const buttonClassName =
  "inline-flex h-10 items-center justify-center rounded-md bg-primary px-[1.65rem] text-[0.91875rem] font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50";

export function HomeAuthButtons() {
  return (
    <div className="flex flex-col gap-[0.504rem] sm:flex-row">
      <SignInButton
        mode="modal"
        forceRedirectUrl="/dashboard"
        signUpForceRedirectUrl="/billing"
      >
        <button type="button" className={buttonClassName}>
          Sign In
        </button>
      </SignInButton>
      <SignUpButton
        mode="modal"
        forceRedirectUrl="/billing"
        signInForceRedirectUrl="/dashboard"
      >
        <button type="button" className={buttonClassName}>
          Sign Up
        </button>
      </SignUpButton>
    </div>
  );
}
