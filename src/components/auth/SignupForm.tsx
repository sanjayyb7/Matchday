"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";

export function SignupForm() {
  const { signUp } = useAuth();
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const trimmed = name.trim();
    if (!trimmed) {
      setError("Enter your name to join the squad.");
      return;
    }
    signUp({ name: trimmed, email: email.trim() || undefined });
    router.push("/map");
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15 }}
      className="relative z-10 w-full max-w-sm px-6 pb-10"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="name" className="mb-1.5 block text-sm font-medium text-white/70">
            Display name
          </label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="What should fans call you?"
            autoComplete="name"
            className="h-12 w-full rounded-2xl border border-white/10 bg-white/8 px-4 text-white placeholder:text-white/30 outline-none backdrop-blur-sm focus:border-[#FFFC00]/50 focus:ring-2 focus:ring-[#FFFC00]/20"
          />
        </div>
        <div>
          <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-white/70">
            Email <span className="text-white/35">(optional)</span>
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            autoComplete="email"
            className="h-12 w-full rounded-2xl border border-white/10 bg-white/8 px-4 text-white placeholder:text-white/30 outline-none backdrop-blur-sm focus:border-[#FFFC00]/50 focus:ring-2 focus:ring-[#FFFC00]/20"
          />
        </div>
        {error && (
          <p className="text-center text-sm text-red-400">{error}</p>
        )}
        <button
          type="submit"
          className="h-14 w-full rounded-full bg-[#FFFC00] text-lg font-bold text-black shadow-[0_4px_24px_rgba(255,252,0,0.35)] transition-transform active:scale-[0.98]"
        >
          Create account
        </button>
      </form>
      <p className="mt-5 text-center text-sm text-white/45">
        Already have an account?{" "}
        <Link href="/login" className="font-semibold text-[#FFFC00] hover:underline">
          Log in
        </Link>
      </p>
      <p className="mt-2 text-center text-xs text-white/30">
        Demo mode — no real account needed yet
      </p>
    </motion.div>
  );
}
