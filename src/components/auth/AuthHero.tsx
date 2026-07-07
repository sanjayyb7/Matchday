"use client";

import { motion } from "framer-motion";

interface AuthHeroProps {
  title: string;
  subtitle: string;
}

export function AuthHero({ title, subtitle }: AuthHeroProps) {
  return (
    <div className="relative flex flex-1 flex-col items-center justify-center px-6 pt-12 text-center">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-[#FFFC00] shadow-[0_8px_32px_rgba(255,252,0,0.35)]"
      >
        <span className="font-heading text-2xl font-bold text-black">LD</span>
      </motion.div>
      <motion.h1
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.08 }}
        className="font-heading text-4xl font-bold tracking-tight text-white"
      >
        {title}
      </motion.h1>
      <motion.p
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.14 }}
        className="mt-3 max-w-[280px] text-base leading-relaxed text-white/65"
      >
        {subtitle}
      </motion.p>
    </div>
  );
}
