"use client";

import { useClerk } from "@clerk/nextjs";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  cancelAccount,
  deleteAccount,
  pauseAccount,
  resumeAccount,
} from "@/actions/account";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { formatTrialEndDate } from "@/lib/free-trial";

type Props = {
  isPaused: boolean;
  isCanceled: boolean;
  isPaidSubscriber: boolean;
  isInFreeTrial: boolean;
  billingPeriodEnd: string | null;
};

type PendingAction = "pause" | "resume" | "cancel" | "delete" | null;

function formatAccessUntil(value: string | null): string | null {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return formatTrialEndDate(date);
}

export function AccountActions({
  isPaused,
  isCanceled,
  isPaidSubscriber,
  isInFreeTrial,
  billingPeriodEnd,
}: Props) {
  const router = useRouter();
  const { signOut } = useClerk();
  const [isPending, startTransition] = useTransition();
  const [pendingAction, setPendingAction] = useState<PendingAction>(null);
  const [error, setError] = useState<string | null>(null);
  const [dialog, setDialog] = useState<PendingAction>(null);
  const [deleteConfirmation, setDeleteConfirmation] = useState("");

  const accessUntil = isPaidSubscriber ? formatAccessUntil(billingPeriodEnd) : null;
  const canResume = isPaused && (!isCanceled || isPaidSubscriber);
  const canPause = !isPaused && (!isCanceled || isPaidSubscriber);
  const canCancel = !isCanceled;

  function run(action: Exclude<PendingAction, "delete" | null>, task: () => Promise<{ ok: boolean; error?: string }>) {
    setError(null);
    setPendingAction(action);
    startTransition(async () => {
      const result = await task();
      setPendingAction(null);
      if (!result.ok) {
        setError(result.error ?? "Something went wrong. Please try again.");
        return;
      }
      setDialog(null);
      router.refresh();
    });
  }

  function handleDelete() {
    setError(null);
    setPendingAction("delete");
    startTransition(async () => {
      const result = await deleteAccount({ confirmation: "delete" });
      if (!result.ok) {
        setPendingAction(null);
        setError(result.error);
        return;
      }
      try {
        await signOut({ redirectUrl: "/" });
      } catch {
        window.location.href = "/";
      }
    });
  }

  return (
    <section className="rounded-lg border border-border/40 bg-card p-6 text-card-foreground shadow-sm">
      <h2 className="text-lg font-medium">Your account</h2>
      <p className="text-muted-foreground mt-2 text-sm">
        Pause, cancel, or permanently delete your LetsMeet account.
      </p>

      {isPaused ? (
        <p className="mt-3 text-sm">Your account is paused. LetsMeet is turned off until you resume.</p>
      ) : null}

      {isCanceled ? (
        <p className="mt-3 text-sm">
          {accessUntil
            ? `Your account is canceled. You can keep using LetsMeet until ${accessUntil}.`
            : "Your account is canceled. Subscribe again to use LetsMeet, or delete the account below."}
        </p>
      ) : null}

      {error ? (
        <p className="text-destructive mt-3 text-sm" role="alert">
          {error}
        </p>
      ) : null}

      <div className="mt-6 flex flex-col gap-6">
        {canResume ? (
          <div className="flex flex-col gap-2">
            <h3 className="text-base font-medium">Resume</h3>
            <p className="text-muted-foreground text-sm">
              Turn your account back on. A subscription that was stopped from renewing stays stopped.
            </p>
            <div>
              <Button
                type="button"
                disabled={isPending}
                onClick={() =>
                  run("resume", resumeAccount)
                }
              >
                {pendingAction === "resume" ? "Resuming…" : "Resume account"}
              </Button>
            </div>
          </div>
        ) : null}

        {canPause ? (
          <div className="flex flex-col gap-2">
            <h3 className="text-base font-medium">Pause</h3>
            <p className="text-muted-foreground text-sm">
              Turn off access right away and keep your profile, groups, and messages. A paid subscription
              will not renew.
              {isInFreeTrial
                ? " Your free trial keeps counting while the account is paused."
                : " Resume before the current period ends to use the time you already paid for."}
            </p>
            <div>
              <Button type="button" variant="outline" disabled={isPending} onClick={() => setDialog("pause")}>
                Pause account
              </Button>
            </div>
          </div>
        ) : null}

        {canCancel ? (
          <div className="flex flex-col gap-2">
            <h3 className="text-base font-medium">Cancel</h3>
            <p className="text-muted-foreground text-sm">
              End your account. A paid subscription will not renew, and you keep access until the end of the
              period you already paid for.
              {isInFreeTrial ? " If you are still in the free trial, access ends now." : ""} Your data stays
              until you delete the account. You can subscribe again later.
            </p>
            <div>
              <Button type="button" variant="outline" disabled={isPending} onClick={() => setDialog("cancel")}>
                Cancel account
              </Button>
            </div>
          </div>
        ) : null}

        <div className="flex flex-col gap-2">
          <h3 className="text-base font-medium">Delete</h3>
          <p className="text-muted-foreground text-sm">
            Permanently delete your sign-in, profile, messages, and groups you own. This cannot be undone.
          </p>
          <div>
            <Button
              type="button"
              variant="destructive"
              disabled={isPending}
              onClick={() => {
                setDeleteConfirmation("");
                setDialog("delete");
              }}
            >
              Delete account
            </Button>
          </div>
        </div>
      </div>

      <Dialog open={dialog === "pause"} onOpenChange={(open) => setDialog(open ? "pause" : null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Pause your account?</DialogTitle>
            <DialogDescription>
              You will lose access immediately. Your data stays, and a paid subscription will not renew. You
              can resume from this page.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" disabled={isPending} onClick={() => setDialog(null)}>
              Keep account active
            </Button>
            <Button type="button" disabled={isPending} onClick={() => run("pause", pauseAccount)}>
              {pendingAction === "pause" ? "Pausing…" : "Pause account"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={dialog === "cancel"} onOpenChange={(open) => setDialog(open ? "cancel" : null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel your account?</DialogTitle>
            <DialogDescription>
              {isPaidSubscriber
                ? accessUntil
                  ? `Your subscription will not renew. You can keep using LetsMeet until ${accessUntil}.`
                  : "Your subscription will not renew. You keep access through the end of the period you already paid for."
                : "Your free trial ends now. Your data stays until you delete the account, and you can subscribe again later."}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" disabled={isPending} onClick={() => setDialog(null)}>
              Keep account
            </Button>
            <Button type="button" disabled={isPending} onClick={() => run("cancel", cancelAccount)}>
              {pendingAction === "cancel" ? "Canceling…" : "Cancel account"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={dialog === "delete"}
        onOpenChange={(open) => {
          if (!open) {
            setDialog(null);
            setDeleteConfirmation("");
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete your account?</DialogTitle>
            <DialogDescription>
              This removes your sign-in, profile, messages, event sign-ups, and groups you own. Any paid
              subscription ends immediately. This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <label className="flex flex-col gap-2 text-sm">
            Type delete to confirm
            <Input
              value={deleteConfirmation}
              onChange={(event) => setDeleteConfirmation(event.target.value)}
              autoComplete="off"
              disabled={isPending}
            />
          </label>
          <DialogFooter>
            <Button type="button" variant="outline" disabled={isPending} onClick={() => setDialog(null)}>
              Keep account
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={isPending || deleteConfirmation !== "delete"}
              onClick={handleDelete}
            >
              {pendingAction === "delete" ? "Deleting…" : "Delete account"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}
