import type { Metadata, Viewport } from "next";
import { Poppins } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { dark } from "@clerk/themes";
import { SiteHeader } from "@/components/SiteHeader";
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
      signInForceRedirectUrl="/billing"
      signUpForceRedirectUrl="/billing"
      signInFallbackRedirectUrl="/billing"
      signUpFallbackRedirectUrl="/billing"
      appearance={{
        baseTheme: dark,
      }}
    >
      <html lang="en" className="dark">
        <body className={`${poppins.variable} flex min-h-screen flex-col antialiased`}>
          <SiteHeader />
          <main className="flex-1">{children}</main>
          <footer className="border-t border-border/40 px-4 py-6 text-center">
            <p className="text-base text-muted-foreground">
              Start something! It could be a massive flop, massive or something in between.
            </p>
          </footer>
        </body>
      </html>
    </ClerkProvider>
  );
}
