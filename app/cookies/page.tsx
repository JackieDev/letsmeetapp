import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Cookies | LetsMeet",
  description:
    "How LetsMeet uses cookies and similar technologies, including whether we use analytics or other non-essential cookies.",
};

const LAST_UPDATED = "19 July 2026";
const CONTACT_EMAIL = "jacqueline@letsmeet.uk";

export default function CookiesPage() {
  return (
    <div className="container mx-auto max-w-screen-md flex flex-col gap-10 px-4 py-10">
      <header>
        <h1 className="text-3xl font-semibold tracking-tight">Cookie Policy</h1>
        <p className="text-muted-foreground mt-2">
          Last updated: {LAST_UPDATED}
        </p>
        <p className="text-muted-foreground mt-4 leading-relaxed">
          This page explains how LetsMeet (&quot;we&quot;, &quot;us&quot;,
          &quot;our&quot;) uses cookies and similar technologies on{" "}
          <a
            href="https://letsmeet.uk"
            className="underline underline-offset-4 hover:text-foreground"
          >
            letsmeet.uk
          </a>
          . It should be read alongside our{" "}
          <Link
            href="/privacy"
            className="underline underline-offset-4 hover:text-foreground"
          >
            Privacy Policy
          </Link>
          .
        </p>
      </header>

      <section className="flex flex-col gap-3">
        <h2 className="text-xl font-semibold tracking-tight">
          1. What are cookies?
        </h2>
        <p className="text-muted-foreground leading-relaxed">
          Cookies are small text files stored on your device when you visit a
          website. Similar technologies include local storage and session
          storage, which apps may use for the same kinds of purposes (for
          example keeping you signed in or remembering settings).
        </p>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-xl font-semibold tracking-tight">
          2. How LetsMeet uses cookies
        </h2>
        <p className="text-muted-foreground leading-relaxed">
          We currently use cookies and similar technologies only where they are
          necessary to provide the service securely. In practice, that means
          authentication and session cookies set by{" "}
          <span className="text-foreground">Clerk</span>, our sign-in, account,
          and billing provider. These cookies help us:
        </p>
        <ul className="list-disc space-y-2 pl-5 text-muted-foreground leading-relaxed">
          <li>Keep you signed in across pages and visits.</li>
          <li>Protect your account against abuse and unauthorised access.</li>
          <li>
            Support checkout and subscription flows managed through Clerk
            Billing.
          </li>
        </ul>
        <p className="text-muted-foreground leading-relaxed">
          These are{" "}
          <span className="text-foreground">essential / strictly necessary</span>{" "}
          cookies. Without them, core features such as signing in and accessing
          your account would not work reliably.
        </p>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-xl font-semibold tracking-tight">
          3. Analytics cookies
        </h2>
        <p className="text-muted-foreground leading-relaxed">
          We do{" "}
          <span className="text-foreground">
            not currently use analytics cookies
          </span>{" "}
          (for example Google Analytics, Plausible, PostHog, or similar tools)
          on LetsMeet. We do not place cookies to measure browsing behaviour for
          analytics dashboards.
        </p>
        <p className="text-muted-foreground leading-relaxed">
          If we introduce analytics in the future and they rely on non-essential
          cookies, we will update this page and, where required by law, ask for
          your consent before setting those cookies.
        </p>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-xl font-semibold tracking-tight">
          4. Advertising and other non-essential cookies
        </h2>
        <p className="text-muted-foreground leading-relaxed">
          We do{" "}
          <span className="text-foreground">
            not currently use advertising, marketing, or other non-essential
            cookies
          </span>{" "}
          on LetsMeet. We do not use third-party ad networks, retargeting pixels,
          or social media tracking cookies on the app.
        </p>
        <p className="text-muted-foreground leading-relaxed">
          Because we only use strictly necessary cookies today, we do not show a
          cookie consent banner for optional cookie categories. If that changes,
          we will provide appropriate controls.
        </p>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-xl font-semibold tracking-tight">
          5. Cookies set by third parties
        </h2>
        <p className="text-muted-foreground leading-relaxed">
          Authentication and billing features are provided by Clerk. Clerk may
          set cookies or use similar technologies that are required for those
          features to work. Those technologies are governed by Clerk&apos;s own
          terms and privacy notices in addition to this policy.
        </p>
        <p className="text-muted-foreground leading-relaxed">
          Our hosting and infrastructure providers may process technical
          request logs that are not browser cookies. Details of how we process
          personal data more generally are in our{" "}
          <Link
            href="/privacy"
            className="underline underline-offset-4 hover:text-foreground"
          >
            Privacy Policy
          </Link>
          .
        </p>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-xl font-semibold tracking-tight">
          6. How long cookies last
        </h2>
        <p className="text-muted-foreground leading-relaxed">
          Session cookies typically expire when you close your browser or end
          your session. Persistent cookies (if used by our authentication
          provider) remain until they expire or you delete them. Exact lifetimes
          depend on Clerk&apos;s session and security settings.
        </p>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-xl font-semibold tracking-tight">
          7. Managing cookies
        </h2>
        <p className="text-muted-foreground leading-relaxed">
          You can control or delete cookies through your browser settings. If
          you block essential cookies, parts of LetsMeet — especially signing in
          and staying signed in — may not work.
        </p>
        <p className="text-muted-foreground leading-relaxed">
          You can also sign out of LetsMeet to end your active session.
        </p>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-xl font-semibold tracking-tight">
          8. Changes to this policy
        </h2>
        <p className="text-muted-foreground leading-relaxed">
          We may update this cookie policy when our cookie use changes. The
          &quot;Last updated&quot; date at the top will change when we do.
        </p>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-xl font-semibold tracking-tight">
          9. Contact
        </h2>
        <p className="text-muted-foreground leading-relaxed">
          Questions about cookies:{" "}
          <a
            href={`mailto:${CONTACT_EMAIL}`}
            className="underline underline-offset-4 hover:text-foreground"
          >
            {CONTACT_EMAIL}
          </a>
          .
        </p>
        <p className="text-muted-foreground leading-relaxed">
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
            href="/"
            className="underline underline-offset-4 hover:text-foreground"
          >
            Back to LetsMeet
          </Link>
        </p>
      </section>
    </div>
  );
}
