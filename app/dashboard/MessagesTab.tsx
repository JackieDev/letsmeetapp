"use client";

import { useState, useTransition } from "react";
import { SendHorizonal } from "lucide-react";
import type { MessageWithUsers } from "@/db/queries/messages";
import { sendMessageToUser } from "@/actions/messages";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

type Props = {
  messages: MessageWithUsers[];
  currentUserId: string;
};

export function MessagesTab({ messages, currentUserId }: Props) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  // Build conversation threads keyed by the other participant.
  const threads = (() => {
    const map = new Map<
      string,
      {
        userId: string;
        name: string | null;
      }
    >();
    for (const m of messages) {
      const isSentByCurrentUser = m.senderUserId === currentUserId;
      const otherUserId = isSentByCurrentUser ? m.recipientUserId : m.senderUserId;
      const otherName = isSentByCurrentUser ? m.recipientName : m.senderName;
      if (!map.has(otherUserId)) {
        map.set(otherUserId, { userId: otherUserId, name: otherName ?? null });
      }
    }
    return Array.from(map.values()).sort((a, b) => {
      const nameA = (a.name ?? "Unknown user").toLowerCase();
      const nameB = (b.name ?? "Unknown user").toLowerCase();
      return nameA.localeCompare(nameB);
    });
  })();

  const [selectedUserId, setSelectedUserId] = useState<string | null>(
    threads[0]?.userId ?? null
  );

  function handleSend(formData: FormData) {
    const recipientName = formData.get("recipientName")?.toString() ?? "";
    const body = formData.get("body")?.toString() ?? "";
    setError(null);

    startTransition(async () => {
      try {
        await sendMessageToUser({ recipientName, body });
      } catch (err) {
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError("Something went wrong sending your message.");
        }
      }
    });
  }

  return (
    <div className="rounded-lg border border-border/40 bg-card p-6 text-card-foreground shadow-sm">
      <h2 className="text-xl font-medium">Messages</h2>
      <p className="text-muted-foreground mt-1 text-base">
        Send a direct message to someone who shares a group with you, by searching their name.
      </p>

      <div className="mt-4 flex gap-4">
        <div className="w-48 shrink-0 border-r border-border/40 pr-2">
          <h3 className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-2">
            Conversations
          </h3>
          {threads.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              No conversations yet.
            </p>
          ) : (
            <ul className="space-y-1 max-h-80 overflow-y-auto pr-1">
              {threads.map((thread) => {
                const label = thread.name ?? "Unknown user";
                const isActive = thread.userId === selectedUserId;
                return (
                  <li key={thread.userId}>
                    <button
                      type="button"
                      onClick={() => setSelectedUserId(thread.userId)}
                      className={`w-full rounded-md px-2 py-1 text-left text-sm ${
                        isActive
                          ? "bg-primary text-primary-foreground"
                          : "hover:bg-accent hover:text-accent-foreground"
                      }`}
                    >
                      {label}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="flex-1 space-y-4">
          <form
            action={handleSend}
            className="space-y-3"
          >
            <div className="space-y-1.5">
              <label className="text-sm font-medium" htmlFor="recipientName">
                Recipient name
              </label>
              <Input
                id="recipientName"
                name="recipientName"
                placeholder="Start typing their name"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium" htmlFor="body">
                Message
              </label>
              <textarea
                id="body"
                name="body"
                className="min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="Write your message…"
                required
              />
            </div>

            {error ? (
              <p className="text-sm text-destructive">{error}</p>
            ) : null}

            <Button
              type="submit"
              disabled={isPending}
              className="inline-flex items-center gap-2"
            >
              <SendHorizonal className="h-4 w-4" />
              {isPending ? "Sending..." : "Send message"}
            </Button>
          </form>

          <div className="border-t border-border/40 pt-4">
            <h3 className="text-sm font-medium text-muted-foreground mb-2">
              Conversation history
            </h3>
            {messages.length === 0 || !selectedUserId ? (
              <p className="text-muted-foreground text-sm">
                {messages.length === 0
                  ? "You don&apos;t have any messages yet."
                  : "Select a conversation on the left to view messages."}
              </p>
            ) : (
              <ul className="space-y-2 max-h-80 overflow-y-auto pr-1">
                {messages
                  .filter(
                    (message) =>
                      (message.senderUserId === currentUserId &&
                        message.recipientUserId === selectedUserId) ||
                      (message.recipientUserId === currentUserId &&
                        message.senderUserId === selectedUserId)
                  )
                  .map((message) => {
                    const isSentByCurrentUser =
                      message.senderUserId === currentUserId;
                    return (
                      <li
                        key={message.id}
                        className="flex flex-col rounded-md border border-border/40 bg-background px-3 py-2 text-sm"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-medium">
                            {isSentByCurrentUser ? "You" : "Them"}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {new Date(message.createdAt).toLocaleString()}
                          </span>
                        </div>
                        <p className="mt-1 whitespace-pre-wrap text-sm">
                          {message.body}
                        </p>
                      </li>
                    );
                  })}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

