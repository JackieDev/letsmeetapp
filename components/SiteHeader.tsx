"use client";

import { usePathname } from "next/navigation";
import { SignOutButton, SignedIn } from "@clerk/nextjs";
import { ReportIssueButton } from "@/components/ReportIssueButton";
import { buttonVariants } from "@/components/ui/button";
import { LetsMeetMenu } from "@/app/LetsMeetMenu";

export function SiteHeader() {
  const pathname = usePathname();
  const isHomePage = pathname === "/";

  return (
    <header className="border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-14 w-full items-center">
        <div className="flex flex-1 items-center pl-4">
          <LetsMeetMenu />
        </div>
        <nav className="ml-auto flex items-center gap-4 pr-4">
          <ReportIssueButton />
          <SignedIn>
            <SignOutButton signOutOptions={{ redirectUrl: isHomePage ? "/" : undefined }}>
              <button className={buttonVariants({ variant: "outline", size: "sm" })}>
                Sign Out
              </button>
            </SignOutButton>
          </SignedIn>
        </nav>
      </div>
    </header>
  );
}
