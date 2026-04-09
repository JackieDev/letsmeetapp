"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  markNotificationReadAction,
  markAllNotificationsReadAction,
} from "@/actions/notifications";
import type { Notification } from "@/db/queries/notifications";

type SerializedNotification = Omit<Notification, "readAt" | "createdAt"> & {
  readAt: string | null;
  createdAt: string;
};

interface NotificationsTabProps {
  notifications: SerializedNotification[];
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function NotificationsTab({ notifications }: NotificationsTabProps) {
  const [optimisticRead, setOptimisticRead] = useState<Set<number>>(new Set());
  const [allRead, setAllRead] = useState(false);
  const [isPending, startTransition] = useTransition();

  function isRead(n: SerializedNotification): boolean {
    return allRead || !!n.readAt || optimisticRead.has(n.id);
  }

  const unreadCount = notifications.filter((n) => !isRead(n)).length;

  function handleMarkRead(id: number) {
    setOptimisticRead((prev) => new Set(prev).add(id));
    startTransition(async () => {
      await markNotificationReadAction({ notificationId: id });
    });
  }

  function handleMarkAllRead() {
    setAllRead(true);
    startTransition(async () => {
      await markAllNotificationsReadAction();
    });
  }

  function notificationLink(n: SerializedNotification): string | null {
    if (n.groupId && n.eventId) return `/group/${n.groupId}/event/${n.eventId}`;
    if (n.groupId) return `/group/${n.groupId}`;
    return null;
  }

  return (
    <div className="rounded-lg border border-border/40 bg-card p-6 text-card-foreground shadow-sm">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-xl font-medium">
          Notifications
          {unreadCount > 0 && (
            <span className="ml-2 inline-flex items-center justify-center rounded-full bg-primary px-2 py-0.5 text-xs font-semibold text-primary-foreground">
              {unreadCount}
            </span>
          )}
        </h2>
        {unreadCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleMarkAllRead}
            disabled={isPending}
          >
            Mark all as read
          </Button>
        )}
      </div>

      {notifications.length === 0 ? (
        <p className="text-muted-foreground mt-4 text-base">
          No notifications yet. You&apos;ll be notified when new events are created in your groups or when members sign up for your events.
        </p>
      ) : (
        <ul className="mt-4 space-y-2">
          {notifications.map((n) => {
            const read = isRead(n);
            const link = notificationLink(n);
            return (
              <li
                key={n.id}
                className={`flex items-start gap-3 rounded-md border p-3 text-sm transition-colors ${
                  read
                    ? "border-border/30 bg-background text-muted-foreground"
                    : "border-primary/20 bg-primary/5 text-foreground"
                }`}
              >
                <div
                  className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${
                    read ? "bg-muted" : "bg-primary"
                  }`}
                />
                <div className="min-w-0 flex-1">
                  {link ? (
                    <Link
                      href={link}
                      className="font-medium hover:underline"
                      onClick={() => !read && handleMarkRead(n.id)}
                    >
                      {n.message}
                    </Link>
                  ) : (
                    <span className="font-medium">{n.message}</span>
                  )}
                  <span className="text-muted-foreground ml-2 text-xs">
                    {timeAgo(n.createdAt)}
                  </span>
                </div>
                {!read && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 shrink-0 px-2 text-xs"
                    onClick={() => handleMarkRead(n.id)}
                    disabled={isPending}
                  >
                    Dismiss
                  </Button>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
