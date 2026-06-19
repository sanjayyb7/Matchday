"use client";

import { useTransition } from "react";

interface OAuthButtonsProps {
  mode?: "login" | "signup";
}

export function OAuthButtons({ mode = "login" }: OAuthButtonsProps) {
  const [pending, startTransition] = useTransition();

  return (
    <div className="space-y-3">
      <button
        type="button"
        disabled={pending}
        onClick={() =>
          startTransition(() => {
            window.location.assign("/api/auth/oauth/google");
          })
        }
        className="flex h-14 w-full items-center justify-center rounded-full border border-white/15 bg-white/5 text-base font-semibold text-white transition-transform active:scale-[0.98] disabled:opacity-60"
      >
        Continue with Google
      </button>
      <p className="text-center text-xs text-white/30">
        {mode === "signup"
          ? "Google sign-in creates your Matchday account automatically."
          : "Sign in with your Google account."}
      </p>
    </div>
  );
}
