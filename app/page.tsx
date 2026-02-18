import {
  SignInButton,
  SignUpButton,
  SignedOut,
} from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export default async function Home() {
  const { userId } = await auth();
  if (userId) {
    redirect("/dashboard");
  }

  return (
    <div className="flex min-h-[calc(100vh-3.5rem)] flex-col items-center justify-center gap-8 px-4">
      <div className="flex flex-col items-center gap-3 text-center">
        <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
          Let&apos;s Meet
        </h1>
        <p className="text-lg text-muted-foreground">
          Your new community platform
        </p>
      </div>
      <SignedOut>
        <div className="flex flex-col gap-3 sm:flex-row">
          <SignInButton mode="modal">
            <button className="inline-flex h-10 items-center justify-center rounded-md border border-input bg-background px-6 text-sm font-medium shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50">
              Sign In
            </button>
          </SignInButton>
          <SignUpButton mode="modal">
            <button className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-6 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50">
              Sign Up
            </button>
          </SignUpButton>
        </div>
      </SignedOut>
      <p className="text-sm text-muted-foreground">
        Start something! It could be a massive flop, massive or something in between.
      </p>
    </div>
  );
}
