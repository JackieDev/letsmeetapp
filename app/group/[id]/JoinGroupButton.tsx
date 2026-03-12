"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { joinGroup, type JoinGroupResult } from "@/actions/groups";
import { Button } from "@/components/ui/button";

type Props = {
  groupId: number;
};

export function JoinGroupButton({ groupId }: Props) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  async function handleClick() {
    setError(null);
    const result: JoinGroupResult = await joinGroup({ groupId });
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
      <Button size="sm" onClick={handleClick} disabled={isPending}>
        {isPending ? "Joining…" : "Join group"}
      </Button>
      {error && (
        <p className="text-xs text-destructive" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

