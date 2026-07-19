import type { Metadata, Viewport } from "next";
import { Poppins } from "next/font/google";
import Link from "next/link";
import { ClerkProvider } from "@clerk/nextjs";
import { dark } from "@clerk/themes";
import { SiteHeader } from "@/components/SiteHeader";
import { ServiceWorkerRegistrar } from "@/components/ServiceWorkerRegistrar";
import { InstallPrompt } from "@/components/InstallPrompt";
import "./globals.css";

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
});

export const metadata: Metadata = {
  title: "LetsMeet App",
  description: "Schedule and manage your meetings",
  applicationName: "LetsMeet",
  appleWebApp: {
    capable: true,
    title: "LetsMeet",
    statusBarStyle: "black-translucent",
  },
  formatDetection: { telephone: false },
  icons: {
    icon: [{ url: "/icon.svg", type: "image/svg+xml" }],
  },
  other: {
    "mobile-web-app-capable": "yes",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#09090b",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider
      signInUrl="/"
      signUpUrl="/signed-up"
      signInForceRedirectUrl="/"
      signUpForceRedirectUrl="/signed-up"
      signInFallbackRedirectUrl="/"
      signUpFallbackRedirectUrl="/signed-up"
      appearance={{
        baseTheme: dark,
      }}
    >
      <html lang="en" className="dark">
        <body className={`${poppins.variable} flex min-h-screen flex-col antialiased`}>
          <ServiceWorkerRegistrar />
          <InstallPrompt />
          <SiteHeader />
          <main className="flex-1">{children}</main>
          <footer className="border-t border-border/40 px-4 py-6 text-center">
            <p className="text-base text-muted-foreground">
              Start something! It could be a massive flop, massive or something in between.
            </p>
            <p className="mt-3 text-sm text-muted-foreground">
              <Link
                href="/contact"
                className="underline underline-offset-4 hover:text-foreground"
              >
                Contact
              </Link>
              {" · "}
              <Link
                href="/privacy"
                className="underline underline-offset-4 hover:text-foreground"
              >
                Privacy Policy
              </Link>
              {" · "}
              <Link
                href="/terms-of-service"
                className="underline underline-offset-4 hover:text-foreground"
              >
                Terms of Service
              </Link>
              {" · "}
              <Link
                href="/cookies"
                className="underline underline-offset-4 hover:text-foreground"
              >
                Cookies
              </Link>
            </p>
          </footer>
        </body>
      </html>
    </ClerkProvider>
  );
}
