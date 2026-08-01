"use client";

import { useState } from "react";
import { createGroup, type CreateGroupResult } from "@/actions/groups";
import { Button } from "@/components/ui/button";

const MAX_OBLIGATORY_QUESTIONS = 5;

const inputClassName =
  "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50";

export function CreateGroupForm() {
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [obligatoryQuestions, setObligatoryQuestions] = useState<string[]>([]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);
    setIsSubmitting(true);

    const form = e.currentTarget;
    const name = (form.elements.namedItem("name") as HTMLInputElement).value.trim();
    const description = (form.elements.namedItem("description") as HTMLInputElement).value.trim();
    const keywords = (form.elements.namedItem("keywords") as HTMLInputElement).value.trim();
    const city = (form.elements.namedItem("city") as HTMLInputElement).value.trim();
    const questions = obligatoryQuestions.map((q) => q.trim()).filter(Boolean);

    try {
      const result: CreateGroupResult = await createGroup({
        name,
        description: description || undefined,
        keywords: keywords || undefined,
        city,
        obligatoryQuestions: questions.length > 0 ? questions : undefined,
      });

      if (result.success) {
        form.reset();
        setObligatoryQuestions([]);
        setSuccessMessage("Your group has been submitted for approval.");
        return;
      }

      setError(result.error);
    } catch {
      setError("Something went wrong creating your group. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  function addQuestion() {
    if (obligatoryQuestions.length >= MAX_OBLIGATORY_QUESTIONS) return;
    setObligatoryQuestions((prev) => [...prev, ""]);
  }

  function updateQuestion(index: number, value: string) {
    setObligatoryQuestions((prev) =>
      prev.map((question, i) => (i === index ? value : question))
    );
  }

  function removeQuestion(index: number) {
    setObligatoryQuestions((prev) => prev.filter((_, i) => i !== index));
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
            htmlFor="keywords"
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            Keywords (optional)
          </label>
          <input
            id="keywords"
            name="keywords"
            type="text"
            placeholder="e.g. hiking, outdoors, beginners"
            className={inputClassName}
            disabled={isSubmitting}
          />
          <p className="text-xs text-muted-foreground">
            Comma-separated terms others can search for.
          </p>
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

        <div className="flex flex-col gap-3 rounded-md border border-border/40 bg-background/50 p-4">
          <div className="flex flex-col gap-1">
            <p className="text-sm font-medium leading-none">
              Obligatory join questions (optional)
            </p>
            <p className="text-xs text-muted-foreground">
              Ask up to {MAX_OBLIGATORY_QUESTIONS} questions that people must
              answer when joining your group.
            </p>
          </div>
          {obligatoryQuestions.length > 0 ? (
            <div className="grid gap-3">
              {obligatoryQuestions.map((question, index) => (
                <div key={index} className="flex flex-col gap-2">
                  <div className="flex items-center justify-between gap-2">
                    <label
                      htmlFor={`obligatory-question-${index}`}
                      className="text-sm font-medium leading-none"
                    >
                      Question {index + 1}
                    </label>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeQuestion(index)}
                      disabled={isSubmitting}
                    >
                      Remove
                    </Button>
                  </div>
                  <input
                    id={`obligatory-question-${index}`}
                    type="text"
                    value={question}
                    onChange={(e) => updateQuestion(index, e.target.value)}
                    placeholder="e.g. Why do you want to join?"
                    maxLength={500}
                    className={inputClassName}
                    disabled={isSubmitting}
                  />
                </div>
              ))}
            </div>
          ) : null}
          {obligatoryQuestions.length < MAX_OBLIGATORY_QUESTIONS ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addQuestion}
              disabled={isSubmitting}
              className="w-fit"
            >
              Add question
            </Button>
          ) : (
            <p className="text-xs text-muted-foreground">
              Maximum of {MAX_OBLIGATORY_QUESTIONS} questions reached.
            </p>
          )}
        </div>

        {error && (
          <p className="text-destructive text-sm" role="alert">
            {error}
          </p>
        )}
        {successMessage && (
          <p className="text-emerald-700 text-sm dark:text-emerald-300" role="status">
            {successMessage}
          </p>
        )}
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Creating…" : "Create group"}
        </Button>
      </div>
    </form>
  );
}
