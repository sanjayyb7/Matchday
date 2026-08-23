"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { NameStack } from "@/components/visual/NameStack";
import { Well } from "@/components/visual/Well";
import type { Player } from "@/types";

const POSITION_ORDER = [
  "Goalkeeper",
  "Defender",
  "Midfielder",
  "Forward",
] as const;

const POSITION_LABEL: Record<(typeof POSITION_ORDER)[number], string> = {
  Goalkeeper: "Goalkeepers",
  Defender: "Defenders",
  Midfielder: "Midfielders",
  Forward: "Forwards",
};

interface PlayerPickerProps {
  players: Player[];
  teamColor: string;
  onSelect: (player: Player) => void;
}

export function PlayerPicker({ players, teamColor, onSelect }: PlayerPickerProps) {
  void teamColor;
  if (players.length === 0) {
    return (
      <p className="py-8 text-center font-utility text-sm text-ink-muted">
        No players available for this team yet.
      </p>
    );
  }

  const grouped = POSITION_ORDER.map((position) => ({
    position,
    rows: players.filter((player) => player.position === position),
  })).filter((group) => group.rows.length > 0);

  const leftover = players.filter(
    (player) =>
      !POSITION_ORDER.includes(
        player.position as (typeof POSITION_ORDER)[number],
      ),
  );
  if (leftover.length > 0) {
    grouped.push({ position: "Midfielder", rows: leftover });
  }

  return (
    <div className="flex flex-col">
      {grouped.map(({ position, rows }) => (
        <div key={position}>
          <div className="sticky top-0 z-10 flex min-h-11 items-center justify-between bg-ink px-4 font-display text-chip text-paper">
            <span>{POSITION_LABEL[position]}</span>
            <span>{rows.length}</span>
          </div>
          {rows.map((player, i) => (
            <motion.button
              key={player.id}
              type="button"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              whileTap={{ filter: "brightness(0.96)" }}
              onClick={() => onSelect(player)}
              className="flex min-h-14 w-full items-center gap-3 bg-paper px-4 py-2.5 text-left transition-[filter] duration-[var(--duration-press)] ease-out focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-[-3px] focus-visible:outline-live"
            >
              <span className="w-10 shrink-0 font-display text-stat text-ghost">
                {player.number}
              </span>
              <Well className="size-12">
                <Image
                  src={player.imageUrl}
                  alt={player.name}
                  fill
                  className="object-cover"
                  unoptimized
                />
              </Well>
              <NameStack
                name={player.name}
                emphasize="last"
                className="min-w-0 text-name"
              />
            </motion.button>
          ))}
        </div>
      ))}
    </div>
  );
}
