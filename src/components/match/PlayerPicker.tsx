"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import type { Player } from "@/types";

interface PlayerPickerProps {
  players: Player[];
  teamColor: string;
  onSelect: (player: Player) => void;
}

export function PlayerPicker({ players, teamColor, onSelect }: PlayerPickerProps) {
  if (players.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-white/50">
        No players available for this team yet.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {players.map((player, i) => (
        <motion.button
          key={player.id}
          type="button"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.03 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => onSelect(player)}
          className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-2.5 text-left transition-colors hover:border-white/20 hover:bg-white/[0.06] active:scale-[0.98]"
          style={{ borderColor: `${teamColor}44` }}
        >
          <span
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-black/20 font-heading text-xl font-black tabular-nums"
            style={{ color: teamColor }}
          >
            {player.number}
          </span>

          <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-lg ring-1 ring-white/10">
            <Image
              src={player.imageUrl}
              alt={player.name}
              fill
              className="object-cover"
              unoptimized
            />
          </div>

          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold leading-tight text-white">
              {player.name}
            </p>
            <p className="mt-0.5 truncate text-xs text-white/45">
              {player.position}
            </p>
          </div>
        </motion.button>
      ))}
    </div>
  );
}
