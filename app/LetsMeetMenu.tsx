"use client";

import { useAuth } from "@clerk/nextjs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function LetsMeetMenu() {
  const { isSignedIn } = useAuth();

  const navigateWithHttpRequest = (url: string) => {
    window.location.assign(url);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className="inline-flex items-center gap-2 font-semibold transition-opacity hover:opacity-80"
          type="button"
          aria-label="Open navigation menu"
        >
          <span
            aria-hidden="true"
            className="inline-flex h-4 w-[1.3rem] flex-col justify-between"
          >
            <span className="h-0.5 w-[1.3rem] rounded bg-foreground" />
            <span className="h-0.5 w-[1.3rem] rounded bg-foreground" />
            <span className="h-0.5 w-[1.3rem] rounded bg-foreground" />
          </span>
          LetsMeet
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        <DropdownMenuItem
          disabled={!isSignedIn}
          onSelect={() => navigateWithHttpRequest("/dashboard?tab=profile")}
          className={isSignedIn ? "cursor-pointer" : undefined}
        >
          Dashboard
        </DropdownMenuItem>
        <DropdownMenuItem
          disabled={!isSignedIn}
          onSelect={() => navigateWithHttpRequest("/calendar")}
          className={isSignedIn ? "cursor-pointer" : undefined}
        >
          Calendar
        </DropdownMenuItem>
        <DropdownMenuItem
          onSelect={() => navigateWithHttpRequest("/groups")}
          className="cursor-pointer"
        >
          Search Groups
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
