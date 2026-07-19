import type { Metadata } from "next";
import Link from "next/link";
import { ContactForm } from "./ContactForm";

export const metadata: Metadata = {
  title: "Contact | LetsMeet",
  description:
    "Get in touch with LetsMeet support. We aim to respond within 3 working days.",
};

const CONTACT_EMAIL = "jacqueline@letsmeet.uk";

export default function ContactPage() {
  return (
    <div className="container mx-auto max-w-screen-md flex flex-col gap-10 px-4 py-10">
      <header>
        <h1 className="text-3xl font-semibold tracking-tight">Contact</h1>
        <p className="text-muted-foreground mt-2 leading-relaxed">
          Get in touch with someone from LetsMeet for support, account
          questions, billing help, or general enquiries.
        </p>
      </header>

      <section className="flex flex-col gap-3">
        <h2 className="text-xl font-semibold tracking-tight">Email</h2>
        <p className="text-muted-foreground leading-relaxed">
          Email us at{" "}
          <a
            href={`mailto:${CONTACT_EMAIL}`}
            className="underline underline-offset-4 hover:text-foreground"
          >
            {CONTACT_EMAIL}
          </a>
          .
        </p>
        <p className="text-muted-foreground leading-relaxed">
          We aim to respond within{" "}
          <span className="text-foreground">3 working days</span>. Working days
          are Monday to Friday, excluding UK public holidays. Urgent
          security-related reports are prioritised where possible.
        </p>
      </section>

      <section className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <h2 className="text-xl font-semibold tracking-tight">
            Send a message
          </h2>
          <p className="text-muted-foreground leading-relaxed">
            Prefer to write here? Use the form below and we&apos;ll get back to
            you at the email you provide.
          </p>
        </div>
        <ContactForm />
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-xl font-semibold tracking-tight">
          Reporting a technical issue
        </h2>
        <p className="text-muted-foreground leading-relaxed">
          If something in the app is broken, you can also use{" "}
          <span className="text-foreground">Report an issue</span> in the site
          header while signed in or browsing. For anything else — including
          account access, groups, events, billing, or privacy requests — email
          or use the form on this page.
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
