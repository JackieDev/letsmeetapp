"use client";

import { useState } from "react";
import { useUser } from "@clerk/nextjs";
import { submitContact, type ContactResult } from "@/actions/contact";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export function ContactForm() {
  const { user } = useUser();
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const defaultEmail = user?.primaryEmailAddress?.emailAddress ?? "";
  const defaultName =
    [user?.firstName?.trim(), user?.lastName?.trim()].filter(Boolean).join(" ") ||
    "";

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    setIsSubmitting(true);

    const form = e.currentTarget;
    const name = (form.elements.namedItem("name") as HTMLInputElement).value.trim();
    const email = (form.elements.namedItem("email") as HTMLInputElement).value.trim();
    const message = (
      form.elements.namedItem("message") as HTMLTextAreaElement
    ).value.trim();

    const result: ContactResult = await submitContact({
      name: name || undefined,
      email,
      message,
    });

    setIsSubmitting(false);

    if (result.success) {
      setSuccess(true);
      form.reset();
      return;
    }

    setError(result.error);
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="contact-name">Name (optional)</Label>
        <Input
          id="contact-name"
          name="name"
          type="text"
          defaultValue={defaultName}
          placeholder="Your name"
          disabled={isSubmitting}
          autoComplete="name"
          maxLength={200}
        />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="contact-email">Email</Label>
        <Input
          id="contact-email"
          name="email"
          type="email"
          defaultValue={defaultEmail}
          placeholder="you@example.com"
          required
          disabled={isSubmitting}
          autoComplete="email"
        />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="contact-message">Message</Label>
        <textarea
          id="contact-message"
          name="message"
          placeholder="How can we help?"
          required
          disabled={isSubmitting}
          rows={5}
          maxLength={5000}
          className={cn(
            "flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-base shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
          )}
        />
      </div>
      {error && (
        <p className="text-destructive text-sm" role="alert">
          {error}
        </p>
      )}
      {success && (
        <p className="text-muted-foreground text-sm" role="status">
          Thanks — your message has been sent. We aim to reply within 3 working
          days.
        </p>
      )}
      <Button type="submit" disabled={isSubmitting} className="self-start">
        {isSubmitting ? "Sending…" : "Send message"}
      </Button>
    </form>
  );
}
