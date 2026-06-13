"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";

export function MockLoginButton() {
  const { signIn } = useAuth();
  const router = useRouter();

  const handleEnter = () => {
    signIn();
    router.push("/map");
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="relative z-10 w-full max-w-sm px-6 pb-12"
    >
      <button
        type="button"
        onClick={handleEnter}
        className="h-14 w-full rounded-full bg-[#FFFC00] text-lg font-bold text-black shadow-[0_4px_24px_rgba(255,252,0,0.4)] transition-transform active:scale-[0.98]"
      >
        Enter Matchday
      </button>
      <p className="mt-3 text-center text-sm text-white/40">
        Demo mode — tap to jump in
      </p>
    </motion.div>
  );
}
