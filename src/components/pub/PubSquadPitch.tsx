"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";
import { FormationPlayerCard } from "./FormationPlayerCard";
import { SquadRewardPanel } from "./SquadRewardPanel";
import {
  assignStartingEleven,
  countPresentStartingPlayers,
  isGoalkeeper,
  presentPlayerCounts,
  STARTING_XI_SIZE,
  startingElevenIds,
  teamIdsByFanCount,
  type FormationRow,
  type RosterFormationSlot,
} from "@/lib/squad/formation";
import {
  getLiveOrUpcomingMatch,
  getPlayersByTeam,
  getTeam,
} from "@/lib/mock/data";
import { useMatchdayStore } from "@/store/matchday-store";
import { staggerContainer, staggerItem } from "@/lib/motion/tokens";
import type { FanPresence, Player } from "@/types";
import { cn } from "@/lib/utils";

interface PubSquadPitchProps {
  squad: FanPresence[];
  pubName?: string;
}

const PITCH_WIDTH = "mx-auto w-full max-w-sm";

function FormationRow({
  row,
  slots,
  presentCounts,
  inverted,
  reduced,
}: {
  row: FormationRow;
  slots: RosterFormationSlot[];
  presentCounts: Map<string, number>;
  inverted?: boolean;
  reduced: boolean;
}) {
  if (slots.length === 0) return null;

  return (
    <motion.div
      variants={staggerContainer(reduced)}
      initial="hidden"
      animate="show"
      className={cn(
        "flex w-full items-end justify-evenly",
        row === "attack" && "pt-2",
        row === "midfield" && "py-0.5",
        row === "defense" && "pb-0.5",
        row === "goalkeeper" && "pb-1",
        slots.length === 2 && "gap-8",
        slots.length >= 4 && "gap-0.5 px-0",
      )}
    >
      {slots.map(({ player }) => {
        const fanCount = presentCounts.get(player.id) ?? 0;
        const flip = inverted || isGoalkeeper(player);
        return (
          <motion.div key={player.id} variants={staggerItem(reduced)}>
            <FormationPlayerCard
              player={player}
              isPresent={fanCount > 0}
              fanCount={fanCount}
              inverted={flip}
              compact
            />
          </motion.div>
        );
      })}
    </motion.div>
  );
}

function BenchRow({
  players,
  presentCounts,
}: {
  players: Player[];
  presentCounts: Map<string, number>;
}) {
  if (players.length === 0) return null;

  return (
    <div className={cn("rounded-2xl border border-white/10 bg-white/[0.03] px-3 py-3", PITCH_WIDTH)}>
      <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-white/40">
        Bench
      </p>
      <div className="flex flex-wrap items-end justify-center gap-3">
        {players.map((player) => {
          const fanCount = presentCounts.get(player.id) ?? 0;
          return (
            <FormationPlayerCard
              key={player.id}
              player={player}
              isPresent={fanCount > 0}
              fanCount={fanCount}
              compact
            />
          );
        })}
      </div>
    </div>
  );
}

function resolveDefaultTeamId(
  squad: FanPresence[],
  identityTeamId?: string,
): string {
  const teamsAtPub = teamIdsByFanCount(squad);
  if (identityTeamId && teamsAtPub.includes(identityTeamId)) {
    return identityTeamId;
  }
  if (teamsAtPub.length > 0) return teamsAtPub[0];
  const match = getLiveOrUpcomingMatch();
  return identityTeamId ?? match?.homeTeamId ?? "spain";
}

export function PubSquadPitch({ squad, pubName }: PubSquadPitchProps) {
  const reduced = useReducedMotion() ?? false;
  const identity = useMatchdayStore((s) => s.identity);
  const teamsAtPub = useMemo(() => teamIdsByFanCount(squad), [squad]);
  const defaultTeamId = useMemo(
    () => resolveDefaultTeamId(squad, identity?.teamId),
    [squad, identity?.teamId],
  );
  const [selectedTeamId, setSelectedTeamId] = useState(defaultTeamId);

  useEffect(() => {
    setSelectedTeamId(defaultTeamId);
  }, [defaultTeamId]);

  const roster = getPlayersByTeam(selectedTeamId);
  const { starting, bench } = assignStartingEleven(roster);
  const startingIds = startingElevenIds({ starting, bench });
  const presentCounts = presentPlayerCounts(squad, selectedTeamId);
  const presentCount = [...presentCounts.values()].reduce((a, b) => a + b, 0);
  const presentPlayerCount = countPresentStartingPlayers(
    presentCounts,
    startingIds,
  );
  const team = getTeam(selectedTeamId);

  return (
    <div className="space-y-3">
      {teamsAtPub.length > 1 && (
        <div className="flex gap-2">
          {teamsAtPub.map((teamId) => {
            const t = getTeam(teamId);
            const fans = squad.filter((f) => f.teamId === teamId).length;
            const active = teamId === selectedTeamId;
            return (
              <button
                key={teamId}
                type="button"
                onClick={() => setSelectedTeamId(teamId)}
                className={cn(
                  "flex flex-1 items-center justify-center gap-2 rounded-xl border px-3 py-2 text-sm font-semibold transition-colors",
                  active
                    ? "border-[#FFFC00]/50 bg-[#FFFC00]/10 text-white"
                    : "border-white/10 bg-white/5 text-white/60",
                )}
              >
                {t && (
                  <Image
                    src={t.flagUrl}
                    alt=""
                    width={20}
                    height={14}
                    className="rounded-sm"
                    unoptimized
                  />
                )}
                {t?.name ?? teamId} ({fans})
              </button>
            );
          })}
        </div>
      )}

      <div className={cn("flex items-center justify-between px-1 text-xs text-white/50", PITCH_WIDTH)}>
        <span>{team?.name ?? "Squad"} · 4-4-2</span>
        <span>
          {presentCount} fan{presentCount === 1 ? "" : "s"} here ·{" "}
          {presentPlayerCount}/{STARTING_XI_SIZE} players
        </span>
      </div>

      <div className={PITCH_WIDTH}>
        <SquadRewardPanel
          presentPlayers={presentPlayerCount}
          rosterSize={STARTING_XI_SIZE}
          presentFans={presentCount}
          pubName={pubName}
        />
      </div>

      <div className={cn("relative aspect-[3/4] max-h-[500px] overflow-hidden rounded-2xl", PITCH_WIDTH)}>
        <div className="absolute inset-0 bg-[#1a4d35]" />
        <div
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage:
              "repeating-linear-gradient(90deg, transparent, transparent 48px, rgba(255,255,255,0.03) 48px, rgba(255,255,255,0.03) 49px)",
          }}
        />

        <div className="absolute inset-3 rounded-lg border border-white/25" />
        <div className="absolute left-3 right-3 top-1/2 h-px -translate-y-1/2 bg-white/25" />
        <div className="absolute left-1/2 top-1/2 h-16 w-16 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/25" />
        <div className="absolute bottom-3 left-1/2 h-20 w-[55%] -translate-x-1/2 rounded-t-lg border border-b-0 border-white/25" />
        <div className="absolute top-3 left-1/2 h-20 w-[55%] -translate-x-1/2 rounded-b-lg border border-t-0 border-white/25" />

        <div
          key={selectedTeamId}
          className="relative flex h-full flex-col justify-between px-3 py-4 sm:px-5"
        >
          <FormationRow
            row="attack"
            slots={starting.attack}
            presentCounts={presentCounts}
            reduced={reduced}
          />
          <FormationRow
            row="midfield"
            slots={starting.midfield}
            presentCounts={presentCounts}
            reduced={reduced}
          />
          <FormationRow
            row="defense"
            slots={starting.defense}
            presentCounts={presentCounts}
            inverted
            reduced={reduced}
          />
          <FormationRow
            row="goalkeeper"
            slots={starting.goalkeeper}
            presentCounts={presentCounts}
            inverted
            reduced={reduced}
          />
        </div>
      </div>

      <BenchRow players={bench} presentCounts={presentCounts} />
    </div>
  );
}
