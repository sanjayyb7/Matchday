"use client";

import { MatchHistoryCard } from "./MatchHistoryCard";
import type { MatchHistoryEntry } from "@/types";

interface FanHistoryTimelineProps {
  history: MatchHistoryEntry[];
}

export function FanHistoryTimeline({ history }: FanHistoryTimelineProps) {
  if (history.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-white/10 p-8 text-center">
        <p className="text-sm text-muted-foreground">
          No matchday history yet. Pick a player and hit a pub!
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {history.map((entry) => (
        <MatchHistoryCard key={entry.id} entry={entry} />
      ))}
    </div>
  );
}
