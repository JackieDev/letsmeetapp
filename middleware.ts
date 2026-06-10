import { clerkMiddleware } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { ACCOUNTS_HOST, getPrimaryAppOrigin } from "@/lib/app-url";

function isSignUpPath(pathname: string): boolean {
  return pathname === "/sign-up" || pathname.startsWith("/sign-up/");
}

function redirectSignUpToHome(request: NextRequest): NextResponse | null {
  if (!isSignUpPath(request.nextUrl.pathname)) return null;

  const host = request.headers.get("host")?.split(":")[0] ?? "";
  if (host === ACCOUNTS_HOST) {
    return NextResponse.redirect(new URL("/", getPrimaryAppOrigin()));
  }

  return NextResponse.redirect(new URL("/", request.url));
}

export default clerkMiddleware((_auth, request) => {
  const redirect = redirectSignUpToHome(request);
  if (redirect) return redirect;
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
