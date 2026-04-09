import type { Metadata, Viewport } from "next";
import Link from "next/link";
import { Poppins } from "next/font/google";
import {
  ClerkProvider,
  SignOutButton,
  SignedIn,
  SignedOut,
} from "@clerk/nextjs";
import { dark } from "@clerk/themes";
import { ReportIssueButton } from "@/components/ReportIssueButton";
import { buttonVariants } from "@/components/ui/button";
import { LetsMeetMenu } from "./LetsMeetMenu";
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

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#09090b",
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
                  <LetsMeetMenu />
                </SignedIn>
                <SignedOut>
                  <Link href="/" className="font-semibold hover:opacity-80 transition-opacity">
                    LetsMeet
                  </Link>
                </SignedOut>
              </div>
              <nav className="flex items-center gap-4 pr-4 ml-auto">
                <ReportIssueButton />
                <SignedIn>
                  <SignOutButton>
                    <button className={buttonVariants({ variant: "outline", size: "sm" })}>
                      Sign Out
                    </button>
                  </SignOutButton>
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
