import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy | LetsMeet",
  description:
    "How LetsMeet collects, uses, stores, and shares personal data under UK GDPR.",
};

const LAST_UPDATED = "19 July 2026";
const CONTACT_EMAIL = "jacqueline@letsmeet.uk";

export default function PrivacyPage() {
  return (
    <div className="container mx-auto max-w-screen-md flex flex-col gap-10 px-4 py-10">
      <header>
        <h1 className="text-3xl font-semibold tracking-tight">Privacy Policy</h1>
        <p className="text-muted-foreground mt-2">
          Last updated: {LAST_UPDATED}
        </p>
        <p className="text-muted-foreground mt-4 leading-relaxed">
          This policy explains how LetsMeet (&quot;we&quot;, &quot;us&quot;,
          &quot;our&quot;) collects and uses personal data when you use{" "}
          <a
            href="https://letsmeet.uk"
            className="underline underline-offset-4 hover:text-foreground"
          >
            letsmeet.uk
          </a>{" "}
          and related services. We aim to meet the expectations of the UK GDPR
          and the Data Protection Act 2018.
        </p>
      </header>

      <section className="flex flex-col gap-3">
        <h2 className="text-xl font-semibold tracking-tight">
          1. Who is responsible for your data
        </h2>
        <p className="text-muted-foreground leading-relaxed">
          LetsMeet is the data controller for personal data processed through
          the app. For privacy questions or requests, contact us at{" "}
          <a
            href={`mailto:${CONTACT_EMAIL}`}
            className="underline underline-offset-4 hover:text-foreground"
          >
            {CONTACT_EMAIL}
          </a>
          .
        </p>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-xl font-semibold tracking-tight">
          2. What we collect
        </h2>
        <p className="text-muted-foreground leading-relaxed">
          Depending on how you use LetsMeet, we may process:
        </p>
        <ul className="list-disc space-y-2 pl-5 text-muted-foreground leading-relaxed">
          <li>
            <span className="text-foreground">Account and identity data</span> —
            email address, name, and authentication identifiers provided via
            Clerk when you sign up or sign in.
          </li>
          <li>
            <span className="text-foreground">Profile data</span> — display
            name, city, interests, and optional profile photo.
          </li>
          <li>
            <span className="text-foreground">Group and event content</span> —
            groups you create or join, events, locations, descriptions,
            attendance, comments, and event notes.
          </li>
          <li>
            <span className="text-foreground">Messages and notifications</span> —
            direct messages you send to other members who share a group, and
            in-app notification content.
          </li>
          <li>
            <span className="text-foreground">Photos</span> — profile pictures
            and group member photos you upload.
          </li>
          <li>
            <span className="text-foreground">Billing data</span> — subscription
            status, plan identifiers, and related billing metadata needed to
            manage your membership. Payment card details are handled by our
            payment providers through Clerk Billing; we do not store full card
            numbers.
          </li>
          <li>
            <span className="text-foreground">Support communications</span> —
            information you send when reporting an issue (such as email and
            message content).
          </li>
          <li>
            <span className="text-foreground">Technical data</span> — limited
            device and session information needed to operate the service
            securely (for example via authentication cookies and hosting logs).
          </li>
        </ul>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-xl font-semibold tracking-tight">
          3. Why we use your data
        </h2>
        <p className="text-muted-foreground leading-relaxed">
          We use personal data to:
        </p>
        <ul className="list-disc space-y-2 pl-5 text-muted-foreground leading-relaxed">
          <li>Create and manage your account and membership.</li>
          <li>Provide groups, events, calendar, messaging, and related features.</li>
          <li>Send transactional emails (for example group approvals and join requests).</li>
          <li>Process subscriptions, trials, and billing status.</li>
          <li>Respond to support reports and keep the service secure.</li>
          <li>Improve reliability and prevent abuse.</li>
        </ul>
        <p className="text-muted-foreground leading-relaxed">
          Under UK GDPR, our main lawful bases are{" "}
          <span className="text-foreground">contract</span> (to provide the
          service you signed up for),{" "}
          <span className="text-foreground">legitimate interests</span>{" "}
          (security, service improvement, and essential operations, balanced
          against your rights), and where required{" "}
          <span className="text-foreground">legal obligation</span> (for example
          keeping records needed for tax or regulatory purposes). Where we rely
          on consent for a specific optional use, you can withdraw it at any
          time.
        </p>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-xl font-semibold tracking-tight">
          4. Messaging and profiles
        </h2>
        <p className="text-muted-foreground leading-relaxed">
          Profile details you choose to share (such as name, city, interests,
          and photo) may be visible to other members in contexts related to
          groups and events. Direct messages are private between you and the
          recipient, but we store message content so the feature can work.
          Do not send sensitive personal data in messages or profile fields
          unless you are comfortable with it being processed as described here.
        </p>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-xl font-semibold tracking-tight">
          5. Email
        </h2>
        <p className="text-muted-foreground leading-relaxed">
          We send transactional emails related to your account and groups (for
          example approval notices, join requests, and issue reports). These
          emails are sent using Resend. We do not use your email for unrelated
          marketing without a clear lawful basis and, where required, your
          consent.
        </p>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-xl font-semibold tracking-tight">
          6. Billing
        </h2>
        <p className="text-muted-foreground leading-relaxed">
          Subscriptions and checkout are handled through Clerk Billing. We store
          billing status and related identifiers in our database so we can grant
          or manage access to paid features. Payment processing itself is
          carried out by Clerk and its payment partners under their terms and
          privacy notices.
        </p>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-xl font-semibold tracking-tight">
          7. Third parties who process data for us
        </h2>
        <p className="text-muted-foreground leading-relaxed">
          We use trusted service providers who process personal data on our
          behalf or as independent controllers for their own services:
        </p>
        <ul className="list-disc space-y-2 pl-5 text-muted-foreground leading-relaxed">
          <li>
            <span className="text-foreground">Clerk</span> — authentication,
            sessions, user accounts, and billing/checkout.
          </li>
          <li>
            <span className="text-foreground">Resend</span> — sending
            transactional email.
          </li>
          <li>
            <span className="text-foreground">Neon</span> — hosted PostgreSQL
            database for app data.
          </li>
          <li>
            <span className="text-foreground">Amazon Web Services (AWS)</span> —
            hosting.
          </li>
        </ul>
        <p className="text-muted-foreground leading-relaxed">
          These providers only receive the data needed to perform their role.
          Some may process data outside the UK. Where that happens, we rely on
          appropriate safeguards recognised under UK data protection law (such
          as the UK International Data Transfer Agreement / Addendum or other
          approved mechanisms used by the provider).
        </p>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-xl font-semibold tracking-tight">
          8. How long we keep data
        </h2>
        <p className="text-muted-foreground leading-relaxed">
          We keep personal data only as long as needed for the purposes above:
        </p>
        <ul className="list-disc space-y-2 pl-5 text-muted-foreground leading-relaxed">
          <li>
            Account, profile, group, event, messaging, and notification data —
            while your account is active, and for a reasonable period afterwards
            if needed to close the account, resolve disputes, or meet legal
            requirements.
          </li>
          <li>
            Billing records — for the life of the subscription relationship and
            any retention period required for accounting or legal compliance.
          </li>
          <li>
            Support emails — for as long as needed to handle your report and
            related follow-up.
          </li>
          <li>
            Security and hosting logs — for short operational periods unless a
            longer period is needed to investigate an incident.
          </li>
        </ul>
        <p className="text-muted-foreground leading-relaxed">
          When data is no longer required, we delete or anonymise it where
          practicable.
        </p>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-xl font-semibold tracking-tight">
          9. Cookies and similar technologies
        </h2>
        <p className="text-muted-foreground leading-relaxed">
          We use cookies and similar technologies that are necessary for
          authentication and security (including Clerk session cookies). These
          are required for the service to function. We do not currently use
          analytics cookies or other non-essential advertising cookies on
          LetsMeet. See our{" "}
          <Link
            href="/cookies"
            className="underline underline-offset-4 hover:text-foreground"
          >
            Cookie Policy
          </Link>{" "}
          for more detail.
        </p>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-xl font-semibold tracking-tight">
          10. Your rights (UK GDPR)
        </h2>
        <p className="text-muted-foreground leading-relaxed">
          Depending on the circumstances, you may have the right to:
        </p>
        <ul className="list-disc space-y-2 pl-5 text-muted-foreground leading-relaxed">
          <li>Access a copy of your personal data.</li>
          <li>Correct inaccurate or incomplete data.</li>
          <li>Request deletion of your data.</li>
          <li>Restrict or object to certain processing.</li>
          <li>Receive data you provided in a portable format.</li>
          <li>Withdraw consent where processing is based on consent.</li>
          <li>
            Complain to the UK Information Commissioner&apos;s Office (ICO) at{" "}
            <a
              href="https://ico.org.uk"
              className="underline underline-offset-4 hover:text-foreground"
              rel="noopener noreferrer"
              target="_blank"
            >
              ico.org.uk
            </a>
            .
          </li>
        </ul>
        <p className="text-muted-foreground leading-relaxed">
          To exercise these rights, email{" "}
          <a
            href={`mailto:${CONTACT_EMAIL}`}
            className="underline underline-offset-4 hover:text-foreground"
          >
            {CONTACT_EMAIL}
          </a>
          . We may need to verify your identity before responding. You can also
          update many profile details directly in the app, and manage account
          authentication settings through Clerk.
        </p>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-xl font-semibold tracking-tight">
          11. Children
        </h2>
        <p className="text-muted-foreground leading-relaxed">
          LetsMeet is intended for adults. We do not knowingly collect personal
          data from children under 16. If you believe a child has provided us
          with personal data, contact us and we will take appropriate steps.
        </p>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-xl font-semibold tracking-tight">
          12. Changes to this policy
        </h2>
        <p className="text-muted-foreground leading-relaxed">
          We may update this privacy policy from time to time. The
          &quot;Last updated&quot; date at the top will change when we do. If
          changes are significant, we may provide additional notice in the app
          or by email.
        </p>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-xl font-semibold tracking-tight">
          13. Contact
        </h2>
        <p className="text-muted-foreground leading-relaxed">
          Privacy requests and questions:{" "}
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
