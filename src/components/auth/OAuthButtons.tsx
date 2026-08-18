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
        className="flex h-14 w-full items-center justify-center rounded-full bg-[#FFFC00] text-base font-bold text-black shadow-[0_8px_28px_rgba(255,252,0,0.35)] transition-transform active:scale-[0.98] disabled:opacity-60"
      >
        Continue with Google
      </button>
      <p className="text-center text-xs text-white/30">
        {mode === "signup"
          ? "Google sign-in creates your LocalDerby account automatically."
          : "Sign in with your Google account."}
      </p>
    </div>
  );
}
