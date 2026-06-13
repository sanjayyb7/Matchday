"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { getPlayersByTeam } from "@/lib/mock/data";

const floatingAvatars = [
  ...getPlayersByTeam("spain").slice(0, 3),
  ...getPlayersByTeam("france").slice(0, 2),
];

export function LandingHero() {
  return (
    <div className="relative flex flex-1 flex-col items-center justify-center overflow-hidden px-6 text-center">
      {/* Floating squad avatars */}
      {floatingAvatars.map((player, i) => (
        <motion.div
          key={player.id}
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 0.9, scale: 1 }}
          transition={{ delay: 0.2 + i * 0.08, type: "spring", stiffness: 200 }}
          className="absolute"
          style={{
            top: `${18 + (i % 3) * 22}%`,
            left: i % 2 === 0 ? `${8 + i * 6}%` : undefined,
            right: i % 2 === 1 ? `${8 + i * 4}%` : undefined,
          }}
        >
          <div className="rounded-full bg-gradient-to-br from-[#FFFC00] to-[#00D4FF] p-[2px] shadow-lg">
            <div className="relative h-12 w-12 overflow-hidden rounded-full border-2 border-white sm:h-14 sm:w-14">
              <Image
                src={player.imageUrl}
                alt=""
                fill
                className="object-cover"
                unoptimized
              />
            </div>
          </div>
        </motion.div>
      ))}

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 mb-5"
      >
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-[#FFFC00] shadow-[0_8px_32px_rgba(255,252,0,0.35)]">
          <span className="font-heading text-3xl font-bold text-black">M</span>
        </div>
      </motion.div>

      <motion.h1
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="relative z-10 font-heading text-5xl font-bold tracking-tight text-white"
      >
        Matchday
      </motion.h1>
      <motion.p
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.18 }}
        className="relative z-10 mt-3 max-w-[280px] text-base leading-relaxed text-white/75"
      >
        Find your pub. Pick your player. Snap into the squad.
      </motion.p>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.35 }}
        className="relative z-10 mt-6 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-medium text-white backdrop-blur-sm"
      >
        <span className="live-pulse h-2 w-2 rounded-full bg-[#FFFC00]" />
        Spain vs France · LIVE in SF
      </motion.div>
    </div>
  );
}
