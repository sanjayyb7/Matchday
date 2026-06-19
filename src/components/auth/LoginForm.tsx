"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { OAuthButtons } from "@/components/auth/OAuthButtons";
import { useAuth } from "@/hooks/useAuth";
import { INSFORGE_ENABLED } from "@/lib/insforge/config";

function oauthErrorMessage(code: string) {
  switch (code) {
    case "oauth_failed":
      return "OAuth sign-in was cancelled or failed.";
    case "missing_verifier":
      return "Sign-in timed out. Open http://localhost:3002/login and try Google again.";
    case "exchange_failed":
      return "Could not complete sign-in. Try again.";
    default:
      return "Sign-in failed. Try again.";
  }
}

export function LoginForm() {
  const { signIn } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState(() => {
    const code = searchParams.get("error");
    return code ? oauthErrorMessage(code) : "";
  });

  useEffect(() => {
    const code = searchParams.get("error");
    if (!code) return;
    router.replace("/login", { scroll: false });
  }, [router, searchParams]);

  const handleLogin = () => {
    setError("");
    const session = signIn();
    if (!session) {
      setError("No account found. Sign up first.");
      return;
    }
    router.push("/map");
  };

  if (INSFORGE_ENABLED) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="relative z-10 w-full max-w-sm px-6 pb-10"
      >
        {error && (
          <p className="mb-4 rounded-xl bg-red-500/10 px-4 py-3 text-center text-sm text-red-400">
            {error}
          </p>
        )}
        <OAuthButtons mode="login" />
        <p className="mt-5 text-center text-sm text-white/45">
          New here?{" "}
          <Link href="/signup" className="font-semibold text-[#FFFC00] hover:underline">
            Create account
          </Link>
        </p>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15 }}
      className="relative z-10 w-full max-w-sm px-6 pb-10"
    >
      <div className="space-y-4">
        {error && (
          <p className="rounded-xl bg-red-500/10 px-4 py-3 text-center text-sm text-red-400">
            {error}
          </p>
        )}
        <button
          type="button"
          disabled={pending}
          onClick={() => startTransition(handleLogin)}
          className="h-14 w-full rounded-full bg-[#FFFC00] text-lg font-bold text-black shadow-[0_4px_24px_rgba(255,252,0,0.35)] transition-transform active:scale-[0.98] disabled:opacity-60"
        >
          Log in
        </button>
      </div>
      <p className="mt-5 text-center text-sm text-white/45">
        New here?{" "}
        <Link href="/signup" className="font-semibold text-[#FFFC00] hover:underline">
          Create account
        </Link>
      </p>
      <p className="mt-2 text-center text-xs text-white/30">
        Uses your saved demo session on this device
      </p>
    </motion.div>
  );
}
