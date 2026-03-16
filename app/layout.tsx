import type { Metadata } from "next";
import Link from "next/link";
import { Poppins } from "next/font/google";
import {
  ClerkProvider,
  SignInButton,
  SignUpButton,
  SignedIn,
  SignedOut,
  UserButton,
} from "@clerk/nextjs";
import { dark } from "@clerk/themes";
import { ReportIssueButton } from "@/components/ReportIssueButton";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import "./globals.css";

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
});

export const metadata: Metadata = {
  title: "LetsMeet App",
  description: "Schedule and manage your meetings",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider
      appearance={{
        baseTheme: dark,
      }}
    >
      <html lang="en" className="dark">
        <body className={`${poppins.variable} antialiased`}>
          <header className="border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="flex h-14 w-full items-center">
              <div className="flex flex-1 items-center pl-4">
                <SignedIn>
                  <Link href="/dashboard" className="font-semibold hover:opacity-80 transition-opacity">
                    LetsMeet
                  </Link>
                </SignedIn>
                <SignedOut>
                  <Link href="/" className="font-semibold hover:opacity-80 transition-opacity">
                    LetsMeet
                  </Link>
                </SignedOut>
              </div>
              <nav className="flex items-center gap-4 pr-4 ml-auto">
                <ReportIssueButton />
                <SignedOut>
                  <SignInButton mode="modal">
                    <button className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-[1.65rem] text-[0.91875rem] font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50">
                      Sign In
                    </button>
                  </SignInButton>
                  <SignUpButton mode="modal">
                    <button className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-[1.65rem] text-[0.91875rem] font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50">
                      Sign Up
                    </button>
                  </SignUpButton>
                </SignedOut>
                <SignedIn>
                  <Link
                    href="/groups/search"
                    className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
                  >
                    Search Groups
                  </Link>
                  <Link
                    href="/groups/new"
                    className={cn(buttonVariants({ size: "sm" }))}
                  >
                    Create New Group
                  </Link>
                  <UserButton />
                </SignedIn>
              </nav>
            </div>
          </header>
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
