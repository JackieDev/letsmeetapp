"use client";

import { useEffect, useState } from "react";
import { Download, Share, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface BeforeInstallPromptEvent extends Event {
  readonly userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
  prompt: () => Promise<void>;
}

const DISMISS_KEY = "letsmeet-install-dismissed-at";
const DISMISS_WINDOW_MS = 1000 * 60 * 60 * 24 * 14; // Re-ask after 14 days.

function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as unknown as { standalone?: boolean }).standalone === true
  );
}

function isIos(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent;
  const iosDevice = /iphone|ipad|ipod/i.test(ua);
  // iPadOS 13+ reports as "MacIntel"; disambiguate via touch support.
  const iPadOs = navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1;
  return iosDevice || iPadOs;
}

function wasRecentlyDismissed(): boolean {
  try {
    const raw = localStorage.getItem(DISMISS_KEY);
    if (!raw) return false;
    const at = Number(raw);
    return Number.isFinite(at) && Date.now() - at < DISMISS_WINDOW_MS;
  } catch {
    return false;
  }
}

function rememberDismissal(): void {
  try {
    localStorage.setItem(DISMISS_KEY, String(Date.now()));
  } catch {
    // Ignore storage failures (private mode, etc.).
  }
}

export function InstallPrompt() {
  const [mode, setMode] = useState<"android" | "ios" | null>(null);
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    if (isStandalone() || wasRecentlyDismissed()) return;

    const onBeforeInstall = (event: Event) => {
      event.preventDefault();
      setDeferred(event as BeforeInstallPromptEvent);
      setMode("android");
    };

    const onInstalled = () => {
      setMode(null);
      setDeferred(null);
      rememberDismissal();
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    window.addEventListener("appinstalled", onInstalled);

    // iOS Safari never fires `beforeinstallprompt`, so show a manual hint.
    let iosTimer: number | undefined;
    if (isIos()) {
      iosTimer = window.setTimeout(() => setMode((current) => current ?? "ios"), 1500);
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
      window.removeEventListener("appinstalled", onInstalled);
      if (iosTimer) window.clearTimeout(iosTimer);
    };
  }, []);

  const dismiss = () => {
    setMode(null);
    rememberDismissal();
  };

  const install = async () => {
    if (!deferred) return;
    await deferred.prompt();
    await deferred.userChoice;
    setDeferred(null);
    setMode(null);
  };

  if (!mode) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 flex justify-center p-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">
      <div className="flex w-full max-w-md items-center gap-3 rounded-xl border border-border bg-card p-4 shadow-lg">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/icon.svg"
          alt=""
          aria-hidden="true"
          className="h-11 w-11 shrink-0 rounded-lg"
        />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold">Install LetsMeet</p>
          {mode === "android" ? (
            <p className="text-xs text-muted-foreground">
              Add it to your home screen for a faster, full-screen experience.
            </p>
          ) : (
            <p className="text-xs text-muted-foreground">
              Tap{" "}
              <Share className="inline size-3.5 align-text-bottom" aria-label="the Share icon" />{" "}
              then <span className="font-medium text-foreground">Add to Home Screen</span>.
            </p>
          )}
        </div>
        {mode === "android" && (
          <Button size="sm" onClick={install} className="shrink-0">
            <Download />
            Install
          </Button>
        )}
        <button
          type="button"
          onClick={dismiss}
          aria-label="Dismiss install prompt"
          className="shrink-0 rounded-md p-1 text-muted-foreground transition-colors hover:text-foreground"
        >
          <X className="size-4" />
        </button>
      </div>
    </div>
  );
}
