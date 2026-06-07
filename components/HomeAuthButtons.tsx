"use client";

import { useAuth, useClerk } from "@clerk/nextjs";

const buttonClassName =
  "inline-flex h-10 items-center justify-center rounded-md bg-primary px-[1.65rem] text-[0.91875rem] font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50";

export function HomeAuthButtons() {
  const { isSignedIn } = useAuth();
  const { openSignIn, openSignUp, signOut } = useClerk();

  async function handleSignIn() {
    if (isSignedIn) {
      await signOut();
    }
    openSignIn({ forceRedirectUrl: "/dashboard" });
  }

  async function handleSignUp() {
    if (isSignedIn) {
      await signOut();
    }
    openSignUp({ forceRedirectUrl: "/billing" });
  }

  return (
    <div className="flex flex-col gap-[0.504rem] sm:flex-row">
      <button type="button" className={buttonClassName} onClick={() => void handleSignIn()}>
        Sign In
      </button>
      <button type="button" className={buttonClassName} onClick={() => void handleSignUp()}>
        Sign Up
      </button>
    </div>
  );
}
