"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { leaveGroup, type LeaveGroupResult } from "@/actions/groups";
import { Button } from "@/components/ui/button";

type Props = {
  groupId: number;
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
};

export function LeaveGroupButton({ groupId, variant = "outline", size = "sm", className }: Props) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  async function handleClick() {
    setError(null);
    const result: LeaveGroupResult = await leaveGroup({ groupId });
    if (!result.success) {
      setError(result.error);
      return;
    }
    startTransition(() => {
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col items-stretch gap-1">
      <Button
        variant={variant}
        size={size}
        onClick={handleClick}
        disabled={isPending}
        className={className}
      >
        {isPending ? "Leaving…" : "Leave group"}
      </Button>
      {error && (
        <p className="text-xs text-destructive" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
