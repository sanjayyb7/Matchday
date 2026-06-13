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
  return (
    <div className="grid max-h-[50vh] grid-cols-2 gap-3 overflow-y-auto pr-1">
      {players.map((player, i) => (
        <motion.button
          key={player.id}
          type="button"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.04 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => onSelect(player)}
          className="relative overflow-hidden rounded-2xl border border-white/10 bg-card p-3 text-left shadow-md"
          style={{ borderColor: `${teamColor}55` }}
        >
          <div className="relative mx-auto mb-2 h-20 w-20 overflow-hidden rounded-xl">
            <Image
              src={player.imageUrl}
              alt={player.name}
              fill
              className="object-cover"
              unoptimized
            />
            <span
              className="absolute bottom-0 right-0 rounded-tl-lg px-2 py-0.5 text-lg font-black opacity-30"
              style={{ color: teamColor }}
            >
              {player.number}
            </span>
          </div>
          <p className="truncate text-sm font-bold">{player.name}</p>
          <p className="text-xs text-muted-foreground">{player.position}</p>
        </motion.button>
      ))}
    </div>
  );
}
