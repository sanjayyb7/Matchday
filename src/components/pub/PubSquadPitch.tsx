"use client";

import { FormationPlayerCard } from "./FormationPlayerCard";
import {
  assignFormation,
  countByRow,
  type FormationRow,
} from "@/lib/squad/formation";
import type { FanPresence } from "@/types";
import { cn } from "@/lib/utils";

interface PubSquadPitchProps {
  squad: FanPresence[];
}

function SideMeter({
  label,
  filled,
  max,
  className,
}: {
  label: string;
  filled: number;
  max: number;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col items-center gap-1", className)}>
      <span className="text-[9px] font-bold uppercase tracking-wider text-white/70">
        {label}
      </span>
      <div className="flex flex-col gap-1">
        {Array.from({ length: max }).map((_, i) => (
          <div
            key={i}
            className={cn(
              "h-2 w-6 rounded-sm border border-white/30",
              i < filled ? "bg-white" : "bg-transparent",
            )}
          />
        ))}
      </div>
    </div>
  );
}

function FormationRow({
  row,
  slots,
  inverted,
}: {
  row: FormationRow;
  slots: ReturnType<typeof assignFormation>[FormationRow];
  inverted?: boolean;
}) {
  if (slots.length === 0) return null;

  return (
    <div
      className={cn(
        "flex items-end justify-center gap-6 sm:gap-10",
        row === "attack" && "pt-2",
        row === "midfield" && "py-1",
        row === "defense" && "pb-2",
      )}
    >
      {slots.map(({ member }) => (
        <FormationPlayerCard
          key={member.userId}
          member={member}
          inverted={inverted}
        />
      ))}
    </div>
  );
}

export function PubSquadPitch({ squad }: PubSquadPitchProps) {
  const formation = assignFormation(squad);
  const { attack, defense } = countByRow(squad);

  if (squad.length === 0) {
    return (
      <div className="flex h-[340px] items-center justify-center rounded-2xl border border-white/10 bg-[#1a3d2e]">
        <p className="text-sm text-white/60">No fans nearby yet — be the first!</p>
      </div>
    );
  }

  return (
    <div className="relative mx-auto aspect-[3/4] max-h-[420px] w-full max-w-sm overflow-hidden rounded-2xl">
      {/* Pitch background */}
      <div className="absolute inset-0 bg-[#1a4d35]" />
      <div
        className="absolute inset-0 opacity-30"
        style={{
          backgroundImage:
            "repeating-linear-gradient(90deg, transparent, transparent 48px, rgba(255,255,255,0.03) 48px, rgba(255,255,255,0.03) 49px)",
        }}
      />

      {/* Pitch markings */}
      <div className="absolute inset-3 rounded-lg border border-white/25" />
      <div className="absolute left-3 right-3 top-1/2 h-px -translate-y-1/2 bg-white/25" />
      <div className="absolute left-1/2 top-1/2 h-16 w-16 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/25" />
      <div className="absolute bottom-3 left-1/2 h-20 w-[55%] -translate-x-1/2 rounded-t-lg border border-b-0 border-white/25" />
      <div className="absolute top-3 left-1/2 h-20 w-[55%] -translate-x-1/2 rounded-b-lg border border-t-0 border-white/25" />

      {/* Side meters */}
      <SideMeter
        label="ATT max 5"
        filled={attack}
        max={5}
        className="absolute left-2 top-6"
      />
      <SideMeter
        label="max 5 DEF"
        filled={defense}
        max={5}
        className="absolute bottom-6 left-2"
      />

      {/* Formation */}
      <div className="relative flex h-full flex-col justify-between px-8 py-6 pl-10">
        <FormationRow row="attack" slots={formation.attack} />
        <FormationRow row="midfield" slots={formation.midfield} />
        <FormationRow row="defense" slots={formation.defense} inverted />
      </div>
    </div>
  );
}
