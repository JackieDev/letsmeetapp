"use client";

import { useState } from "react";
import { useUser } from "@clerk/nextjs";
import { submitReportIssue, type ReportIssueResult } from "@/actions/report-issue";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export function ReportIssueButton() {
  const { user } = useUser();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const defaultEmail = user?.primaryEmailAddress?.emailAddress ?? "";

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    setIsSubmitting(true);

    const form = e.currentTarget;
    const email = (form.elements.namedItem("email") as HTMLInputElement).value.trim();
    const message = (form.elements.namedItem("message") as HTMLTextAreaElement).value.trim();

    const result: ReportIssueResult = await submitReportIssue({ email, message });

    setIsSubmitting(false);

    if (result.success) {
      setSuccess(true);
      form.reset();
      setTimeout(() => {
        setOpen(false);
        setSuccess(false);
      }, 1500);
      return;
    }

    setError(result.error);
  }

  function handleOpenChange(next: boolean) {
    if (!next) {
      setError(null);
      setSuccess(false);
    }
    setOpen(next);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="text-muted-foreground">
          Report an issue
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Report an issue</DialogTitle>
          <DialogDescription>
            Describe the issue and we&apos;ll look into it. Your name and account are included automatically if you&apos;re signed in.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="report-email">Email</Label>
            <Input
              id="report-email"
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
            <Label htmlFor="report-message">Message</Label>
            <textarea
              id="report-message"
              name="message"
              placeholder="What went wrong or what would you like to report?"
              required
              disabled={isSubmitting}
              rows={4}
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
              Thanks, your report has been sent.
            </p>
          )}
          <DialogFooter>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Sending…" : "Send report"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
