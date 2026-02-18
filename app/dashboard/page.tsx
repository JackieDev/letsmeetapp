import { SignedIn, SignedOut } from "@clerk/nextjs";
import Link from "next/link";

export default function DashboardPage() {
  return (
    <div className="container max-w-screen-2xl px-4 py-8">
      <SignedIn>
        <div className="flex flex-col gap-6">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">Dashboard</h1>
            <p className="text-muted-foreground mt-1">
              Welcome back. Manage your groups and events from here.
            </p>
          </div>
          <div className="rounded-lg border border-border/40 bg-card p-6 text-card-foreground shadow-sm">
            <h2 className="text-lg font-medium">Getting started</h2>
            <p className="text-sm text-muted-foreground mt-2">
              Your dashboard is ready. Create a group or browse events to get
              started.
            </p>
          </div>
        </div>
      </SignedIn>
      <SignedOut>
        <div className="flex min-h-[50vh] flex-col items-center justify-center gap-6 text-center">
          <h1 className="text-2xl font-semibold">Dashboard</h1>
          <p className="text-muted-foreground max-w-sm">
            Sign in to access your dashboard and manage your groups and events.
          </p>
          <Link
            href="/"
            className="text-sm font-medium text-primary underline-offset-4 hover:underline"
          >
            Back to home
          </Link>
        </div>
      </SignedOut>
    </div>
  );
}
