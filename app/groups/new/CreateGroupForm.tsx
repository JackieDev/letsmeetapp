"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createGroup, type CreateGroupResult } from "@/actions/groups";
import { Button } from "@/components/ui/button";

const inputClassName =
  "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50";

export function CreateGroupForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const form = e.currentTarget;
    const name = (form.elements.namedItem("name") as HTMLInputElement).value.trim();
    const description = (form.elements.namedItem("description") as HTMLInputElement).value.trim();
    const city = (form.elements.namedItem("city") as HTMLInputElement).value.trim();

    const result: CreateGroupResult = await createGroup({
      name,
      description: description || undefined,
      city,
    });

    setIsSubmitting(false);

    if (result.success) {
      router.push("/groups");
      router.refresh();
      return;
    }

    setError(result.error);
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-lg border border-border/40 bg-card p-6 text-card-foreground shadow-sm"
    >
      <div className="grid gap-4">
        <div className="flex flex-col gap-2">
          <label
            htmlFor="name"
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            Name
          </label>
          <input
            id="name"
            name="name"
            type="text"
            required
            placeholder="Group name"
            className={inputClassName}
            disabled={isSubmitting}
          />
        </div>
        <div className="flex flex-col gap-2">
          <label
            htmlFor="description"
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            Description (optional)
          </label>
          <textarea
            id="description"
            name="description"
            rows={3}
            placeholder="What the group is about"
            className={inputClassName + " min-h-[80px] resize-y py-2"}
            disabled={isSubmitting}
          />
        </div>
        <div className="flex flex-col gap-2">
          <label
            htmlFor="city"
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            City
          </label>
          <input
            id="city"
            name="city"
            type="text"
            required
            placeholder="City or town"
            className={inputClassName}
            disabled={isSubmitting}
          />
        </div>
        {error && (
          <p className="text-destructive text-sm" role="alert">
            {error}
          </p>
        )}
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Creating…" : "Create group"}
        </Button>
      </div>
    </form>
  );
}
