"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import type { Team } from "@/types";

interface TeamPickerProps {
  homeTeam: Team;
  awayTeam: Team;
  onSelect: (teamId: string) => void;
}

export function TeamPicker({ homeTeam, awayTeam, onSelect }: TeamPickerProps) {
  return (
    <div className="grid grid-cols-2 gap-4">
      {[homeTeam, awayTeam].map((team) => (
        <motion.button
          key={team.id}
          type="button"
          whileTap={{ scale: 0.97 }}
          onClick={() => onSelect(team.id)}
          className="flex flex-col items-center gap-3 rounded-2xl border border-white/10 bg-card p-6 shadow-lg transition hover:border-primary/50"
          style={{
            background: `linear-gradient(160deg, ${team.color}33 0%, var(--card) 60%)`,
          }}
        >
          <div className="relative h-16 w-16 overflow-hidden rounded-full ring-2 ring-white/20">
            <Image
              src={team.flagUrl}
              alt={team.name}
              fill
              className="object-cover"
            />
          </div>
          <span className="font-heading text-xl font-bold uppercase tracking-wide">
            {team.name}
          </span>
        </motion.button>
      ))}
    </div>
  );
}
