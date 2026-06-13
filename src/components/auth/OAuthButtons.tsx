"use client";

import { useTransition } from "react";
import { initiateOAuth } from "@/lib/auth/oauth-actions";
import type { OAuthProvider } from "@/lib/auth/types";

interface OAuthButtonsProps {
  mode?: "login" | "signup";
}

const providers: { id: OAuthProvider; label: string }[] = [
  { id: "google", label: "Continue with Google" },
  { id: "github", label: "Continue with GitHub" },
];

export function OAuthButtons({ mode = "login" }: OAuthButtonsProps) {
  const [pending, startTransition] = useTransition();

  return (
    <div className="space-y-3">
      {providers.map(({ id, label }) => (
        <button
          key={id}
          type="button"
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              await initiateOAuth(id);
            })
          }
          className="flex h-14 w-full items-center justify-center rounded-full border border-white/15 bg-white/5 text-base font-semibold text-white transition-transform active:scale-[0.98] disabled:opacity-60"
        >
          {label}
        </button>
      ))}
      <p className="text-center text-xs text-white/30">
        {mode === "signup"
          ? "OAuth creates your Matchday account automatically."
          : "Sign in with your connected account."}
      </p>
    </div>
  );
}
