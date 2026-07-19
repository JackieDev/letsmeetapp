import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms of Service | LetsMeet",
  description:
    "Terms of service for LetsMeet, including free trial, annual billing, ownership, acceptable use, and liability.",
};

const LAST_UPDATED = "19 July 2026";
const CONTACT_EMAIL = "jacqueline@letsmeet.uk";

export default function TermsOfServicePage() {
  return (
    <div className="container mx-auto max-w-screen-md flex flex-col gap-10 px-4 py-10">
      <header>
        <h1 className="text-3xl font-semibold tracking-tight">
          Terms of Service
        </h1>
        <p className="text-muted-foreground mt-2">
          Last updated: {LAST_UPDATED}
        </p>
        <p className="text-muted-foreground mt-4 leading-relaxed">
          These Terms of Service (&quot;Terms&quot;) govern your use of LetsMeet
          (&quot;we&quot;, &quot;us&quot;, &quot;our&quot;) at{" "}
          <a
            href="https://letsmeet.uk"
            className="underline underline-offset-4 hover:text-foreground"
          >
            letsmeet.uk
          </a>{" "}
          and related services. By creating an account or using LetsMeet, you
          agree to these Terms. If you do not agree, do not use the service.
        </p>
      </header>

      <section className="flex flex-col gap-3">
        <h2 className="text-xl font-semibold tracking-tight">
          1. The service
        </h2>
        <p className="text-muted-foreground leading-relaxed">
          LetsMeet helps people create and join groups, organise events, message
          other members, and manage related membership features. Features may
          change over time as we improve the product.
        </p>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-xl font-semibold tracking-tight">
          2. Accounts
        </h2>
        <p className="text-muted-foreground leading-relaxed">
          You must provide accurate information when you sign up and keep your
          account secure. You are responsible for activity that occurs under
          your account. Authentication is provided through Clerk; you must also
          comply with Clerk&apos;s applicable terms when using sign-in and
          account features.
        </p>
        <p className="text-muted-foreground leading-relaxed">
          You may only use LetsMeet if you are at least 16 years old (or the
          higher age of digital consent that applies where you live).
        </p>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-xl font-semibold tracking-tight">
          3. Free trial
        </h2>
        <p className="text-muted-foreground leading-relaxed">
          Eligible new members receive a free trial lasting{" "}
          <span className="text-foreground">6 months</span> from account signup.
          During the trial you can use the service according to these Terms
          without paying the annual subscription fee.
        </p>
        <p className="text-muted-foreground leading-relaxed">
          When your trial ends, continued access requires an active paid
          subscription. We may require you to add payment details before or
          during the trial so billing can begin when the trial ends. If you do
          not have an active subscription after the trial, access to paid
          features may be restricted or removed.
        </p>
        <p className="text-muted-foreground leading-relaxed">
          We may change trial eligibility, length, or conditions for future
          signups. Changes will not shorten an active trial already granted to
          your account, except where required for legal, security, or abuse
          reasons.
        </p>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-xl font-semibold tracking-tight">
          4. Annual billing and subscriptions
        </h2>
        <p className="text-muted-foreground leading-relaxed">
          Paid access to LetsMeet is billed on an{" "}
          <span className="text-foreground">annual</span> basis only. Prices,
          plan details, and taxes (if applicable) are shown at checkout or on
          the pricing/billing pages.
        </p>
        <p className="text-muted-foreground leading-relaxed">
          Subscriptions and payments are processed through Clerk Billing and its
          payment partners. By subscribing, you authorise recurring annual
          charges until you cancel according to the cancellation options
          available through billing management.
        </p>
        <p className="text-muted-foreground leading-relaxed">
          Unless stated otherwise at purchase, subscriptions renew annually.
          Fees already paid for a billing period are generally non-refundable,
          except where required by law or where we expressly agree otherwise.
          If a payment fails, we may suspend or limit access until payment is
          successfully processed.
        </p>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-xl font-semibold tracking-tight">
          5. Account and group ownership
        </h2>
        <p className="text-muted-foreground leading-relaxed">
          Your personal account belongs to you. You control your profile and the
          content you post, subject to these Terms and applicable law.
        </p>
        <p className="text-muted-foreground leading-relaxed">
          When you create a group, you are the group owner. Owners (and, where
          applicable, organisers they appoint) control group settings,
          membership, events, and related content for that group. If you leave
          or delete your account, groups you own may be deleted, transferred, or
          otherwise handled as needed to keep the service orderly — for example
          by removing content you solely controlled or by assigning ownership
          where the product supports it.
        </p>
        <p className="text-muted-foreground leading-relaxed">
          Members do not acquire ownership of a group merely by joining it.
          Content you contribute to a group may remain visible to other members
          while that group exists. You grant LetsMeet a non-exclusive licence to
          host, display, and process your content as needed to operate the
          service.
        </p>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-xl font-semibold tracking-tight">
          6. Your content and conduct
        </h2>
        <p className="text-muted-foreground leading-relaxed">
          You are responsible for the groups, events, messages, photos,
          comments, and other content you submit. You must have the rights
          needed to share that content, and it must not violate these Terms or
          the law.
        </p>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-xl font-semibold tracking-tight">
          7. Unacceptable use
        </h2>
        <p className="text-muted-foreground leading-relaxed">
          You must not use LetsMeet to:
        </p>
        <ul className="list-disc space-y-2 pl-5 text-muted-foreground leading-relaxed">
          <li>
            Harass, threaten, abuse, defame, or discriminate against others.
          </li>
          <li>
            Post or share illegal, exploitative, or highly harmful content,
            including content that sexualises minors.
          </li>
          <li>
            Spam, scam, phish, or send unsolicited commercial messages.
          </li>
          <li>
            Impersonate another person or misrepresent your affiliation.
          </li>
          <li>
            Infringe intellectual property, privacy, or other rights.
          </li>
          <li>
            Attempt to access accounts, data, or systems without authorisation;
            probe, scrape, or disrupt the service; or bypass security or usage
            limits.
          </li>
          <li>
            Upload malware or otherwise interfere with the service or other
            users&apos; devices.
          </li>
          <li>
            Use the service in any way that is unlawful or that we reasonably
            consider harmful to LetsMeet, our users, or third parties.
          </li>
        </ul>
        <p className="text-muted-foreground leading-relaxed">
          We may investigate suspected violations, remove content, suspend or
          terminate accounts, and cooperate with law enforcement where
          appropriate.
        </p>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-xl font-semibold tracking-tight">
          8. In-person events
        </h2>
        <p className="text-muted-foreground leading-relaxed">
          LetsMeet is a coordination tool. We do not organise, supervise, or
          control in-person events unless we expressly say otherwise. Group
          organisers and attendees are responsible for the safety, legality, and
          suitability of any event. Use common sense and take appropriate
          precautions when meeting people offline.
        </p>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-xl font-semibold tracking-tight">
          9. Intellectual property
        </h2>
        <p className="text-muted-foreground leading-relaxed">
          LetsMeet, including its branding, design, and software, is owned by us
          or our licensors. These Terms do not transfer ownership of our
          intellectual property to you. You may use the service only as
          permitted under these Terms.
        </p>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-xl font-semibold tracking-tight">
          10. Disclaimers
        </h2>
        <p className="text-muted-foreground leading-relaxed">
          LetsMeet is provided on an &quot;as is&quot; and &quot;as
          available&quot; basis. To the fullest extent permitted by law, we
          disclaim warranties of merchantability, fitness for a particular
          purpose, uninterrupted availability, and error-free operation. We do
          not guarantee that groups, events, or messages will meet your
          expectations or that other users will behave appropriately.
        </p>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-xl font-semibold tracking-tight">
          11. Liability limits
        </h2>
        <p className="text-muted-foreground leading-relaxed">
          To the fullest extent permitted by law:
        </p>
        <ul className="list-disc space-y-2 pl-5 text-muted-foreground leading-relaxed">
          <li>
            We are not liable for indirect, incidental, special, consequential,
            or punitive damages, or for loss of profits, revenue, data,
            goodwill, or business opportunities arising from your use of
            LetsMeet.
          </li>
          <li>
            We are not liable for disputes between users, the outcome of
            real-world events, or content posted by users.
          </li>
          <li>
            Our total aggregate liability arising out of or relating to these
            Terms or the service is limited to the greater of (a) the amount you
            paid us for LetsMeet in the 12 months before the claim, or (b) £50.
          </li>
        </ul>
        <p className="text-muted-foreground leading-relaxed">
          Nothing in these Terms excludes or limits liability that cannot be
          excluded or limited under applicable law, including liability for death
          or personal injury caused by negligence, fraud, or fraudulent
          misrepresentation, or any rights you have as a consumer that cannot
          be waived.
        </p>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-xl font-semibold tracking-tight">
          12. Suspension and termination
        </h2>
        <p className="text-muted-foreground leading-relaxed">
          You may stop using LetsMeet at any time. We may suspend or terminate
          access if you breach these Terms, if required for security or legal
          reasons, or if we discontinue the service. Upon termination, your
          right to use LetsMeet ends, and we may delete or retain data as
          described in our{" "}
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
          13. Changes to these Terms
        </h2>
        <p className="text-muted-foreground leading-relaxed">
          We may update these Terms from time to time. The &quot;Last
          updated&quot; date will change when we do. If a change is material, we
          may provide additional notice in the app or by email. Continued use
          after the updated Terms take effect constitutes acceptance, except
          where applicable law requires otherwise.
        </p>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-xl font-semibold tracking-tight">
          14. Governing law
        </h2>
        <p className="text-muted-foreground leading-relaxed">
          These Terms are governed by the laws of England and Wales. Courts in
          England and Wales have exclusive jurisdiction, except that if you are
          a consumer you may also bring claims in your local courts where
          mandatory consumer protection rules allow.
        </p>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-xl font-semibold tracking-tight">
          15. Contact
        </h2>
        <p className="text-muted-foreground leading-relaxed">
          Questions about these Terms:{" "}
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
