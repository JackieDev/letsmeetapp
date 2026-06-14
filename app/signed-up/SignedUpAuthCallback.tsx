"use client";

import { AuthenticateWithRedirectCallback } from "@clerk/nextjs";

export function SignedUpAuthCallback() {
  return <AuthenticateWithRedirectCallback signUpUrl="/signed-up" />;
}
