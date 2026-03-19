"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { approveGroup, deletePendingGroup } from "@/actions/groups";
import { Button } from "@/components/ui/button";

type PendingGroup = {
  id: number;
  name: string;
  city: string;
  description: string | null;
  ownerId: string;
  createdAt: string;
};

type PendingGroupsAdminTabProps = {
  pendingGroups: PendingGroup[];
};

export function PendingGroupsAdminTab({ pendingGroups }: PendingGroupsAdminTabProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [activeGroupId, setActiveGroupId] = useState<number | null>(null);
  const [activeAction, setActiveAction] = useState<"approve" | "reject" | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleApprove = (groupId: number) => {
    setError(null);
    setActiveGroupId(groupId);
    setActiveAction("approve");
    startTransition(async () => {
      const result = await approveGroup({ groupId });
      if (!result.success) {
        setError(result.error);
        setActiveGroupId(null);
        setActiveAction(null);
        return;
      }
      router.refresh();
      setActiveGroupId(null);
      setActiveAction(null);
    });
  };

  const handleReject = (groupId: number) => {
    const confirmed = window.confirm(
      "Reject this group request? This will permanently delete the pending group."
    );
    if (!confirmed) return;

    setError(null);
    setActiveGroupId(groupId);
    setActiveAction("reject");
    startTransition(async () => {
      const result = await deletePendingGroup({ groupId });
      if (!result.success) {
        setError(result.error);
        setActiveGroupId(null);
        setActiveAction(null);
        return;
      }
      router.refresh();
      setActiveGroupId(null);
      setActiveAction(null);
    });
  };

  return (
    <div className="rounded-lg border border-border/40 bg-card p-6 text-card-foreground shadow-sm">
      <h2 className="text-xl font-medium">Pending groups</h2>
      <p className="text-muted-foreground mt-1 text-sm">
        Review new groups and approve them to make them visible in search.
      </p>

      {error ? (
        <p className="mt-3 text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}

      {pendingGroups.length === 0 ? (
        <p className="text-muted-foreground mt-3 text-sm">No groups are waiting for approval.</p>
      ) : (
        <ul className="mt-3 space-y-2">
          {pendingGroups.map((group) => {
            const isActive = isPending && activeGroupId === group.id;
            const isApprovingThis = isActive && activeAction === "approve";
            const isRejectingThis = isActive && activeAction === "reject";
            return (
              <li
                key={group.id}
                className="flex flex-col gap-3 rounded-md border border-border/40 bg-background p-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <p className="font-medium">{group.name}</p>
                  <p className="text-muted-foreground text-sm">
                    {group.city}
                    {group.description ? ` · ${group.description}` : ""}
                  </p>
                  <p className="text-muted-foreground text-xs">
                    Owner ID: {group.ownerId} · Submitted{" "}
                    {new Date(group.createdAt).toLocaleString()}
                  </p>
                </div>
                <div className="flex items-center gap-2 sm:shrink-0">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => handleReject(group.id)}
                    disabled={isPending}
                  >
                    {isRejectingThis ? "Rejecting..." : "Reject"}
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => handleApprove(group.id)}
                    disabled={isPending}
                  >
                    {isApprovingThis ? "Approving..." : "Approve"}
                  </Button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
