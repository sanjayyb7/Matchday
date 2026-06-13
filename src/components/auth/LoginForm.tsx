"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";

export function LoginForm() {
  const { signIn } = useAuth();
  const router = useRouter();
  const [error, setError] = useState("");

  const handleLogin = () => {
    setError("");
    const session = signIn();
    if (!session) {
      setError("No account found. Sign up first.");
      return;
    }
    router.push("/map");
  };

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
          onClick={handleLogin}
          className="h-14 w-full rounded-full bg-[#FFFC00] text-lg font-bold text-black shadow-[0_4px_24px_rgba(255,252,0,0.35)] transition-transform active:scale-[0.98]"
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
