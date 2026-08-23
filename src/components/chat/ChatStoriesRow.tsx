"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import { getPlayer, getTeam } from "@/lib/mock/data";
import { useMatchdayStore } from "@/store/matchday-store";
import { useRealtime } from "@/lib/realtime/context";
import { INSFORGE_ENABLED } from "@/lib/insforge/config";
import { fetchSquadIdentities } from "@/lib/identity/insforge-identity";
import { cn } from "@/lib/utils";
import type { ChatMessage, FanPresence, Player, Team, UserIdentity } from "@/types";

type SquadMember = {
  userId: string;
  playerId: string;
  /** Missing when the squad hasn't loaded, or the pick predates a roster refresh. */
  player?: Player;
};

function fallbackAvatar(playerId: string, team?: Team): string {
  const color = (team?.color ?? "").replace("#", "") || "ddf56b";
  return `https://api.dicebear.com/7.x/personas/svg?seed=${encodeURIComponent(playerId)}&backgroundColor=${color}`;
}

interface ChatStoriesRowProps {
  messages: ChatMessage[];
  teamId: string;
  matchId: string;
  team?: Team;
}

export function ChatStoriesRow({
  messages,
  teamId,
  matchId,
  team,
}: ChatStoriesRowProps) {
  const identity = useMatchdayStore((s) => s.identity);
  const setSelectedPlayerProfile = useMatchdayStore(
    (s) => s.setSelectedPlayerProfile,
  );
  const realtime = useRealtime();
  const [presence, setPresence] = useState<FanPresence[]>([]);
  const [squadIdentities, setSquadIdentities] = useState<UserIdentity[]>([]);

  useEffect(() => {
    return realtime.subscribeToPresence(setPresence);
  }, [realtime]);

  const loadSquad = useCallback(async () => {
    if (!INSFORGE_ENABLED || !matchId || !teamId) return;
    try {
      setSquadIdentities(await fetchSquadIdentities(matchId, teamId));
    } catch (err) {
      console.error("[squad] failed to load identities", err);
    }
  }, [matchId, teamId]);

  // Poll the identities table so both accounts see each other in the rail,
  // even if realtime presence hasn't published yet.
  useEffect(() => {
    void loadSquad();
    const interval = window.setInterval(() => void loadSquad(), 3000);
    return () => window.clearInterval(interval);
  }, [loadSquad]);

  // A message from someone new means the roster changed — pull it immediately
  // rather than waiting out the poll.
  useEffect(() => {
    void loadSquad();
  }, [messages.length, presence.length, loadSquad]);

  const resolvedTeam = team ?? getTeam(teamId);

  // Live rail = people currently in this squad, not chat history.
  // Keyed by account so one Google user is one persona; a leave drops them
  // even if their old player still appears in the thread.
  const members = new Map<string, SquadMember>();
  for (const row of squadIdentities) {
    if (row.matchId !== matchId || row.teamId !== teamId) continue;
    members.set(row.userId, {
      userId: row.userId,
      playerId: row.playerId,
      player: getPlayer(row.playerId),
    });
  }
  if (
    identity?.matchId === matchId &&
    identity.teamId === teamId &&
    identity.playerId &&
    identity.userId
  ) {
    members.set(identity.userId, {
      userId: identity.userId,
      playerId: identity.playerId,
      player: getPlayer(identity.playerId),
    });
  }

  const sorted = [...members.values()].sort((a, b) => {
    const aYou = identity?.userId === a.userId ? 0 : 1;
    const bYou = identity?.userId === b.userId ? 0 : 1;
    return aYou - bYou;
  });

  return (
    <div className="px-4 py-3">
      <p className="mb-2.5 font-display text-section text-ink-muted">
        Live squad {sorted.length > 0 ? `· ${sorted.length}` : ""}
      </p>
      <div className="flex gap-3 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {sorted.length === 0 && (
          <p className="font-utility text-xs text-ink-muted">
            No teammates in yet — invite a friend.
          </p>
        )}
        {sorted.map(({ userId, playerId, player }) => {
          const isYou = identity?.userId === userId;
          const name = player?.name ?? "Fan";

          return (
            <button
              key={userId}
              type="button"
              disabled={!player}
              onClick={() => player && setSelectedPlayerProfile(player)}
              className="flex shrink-0 flex-col items-center gap-1.5"
            >
              <div
                className="rounded-full"
                style={isYou ? { boxShadow: "var(--ring-avatar)" } : undefined}
              >
                <div className="relative h-14 w-14 overflow-hidden rounded-full border-[3px] border-ink bg-paper">
                  <Image
                    src={player?.imageUrl ?? fallbackAvatar(playerId, resolvedTeam)}
                    alt={name}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                </div>
              </div>
              <span
                className={cn(
                  "max-w-[56px] truncate font-display text-micro",
                  isYou ? "text-ink" : "text-ink-muted",
                )}
              >
                {isYou ? "You" : name.split(" ").pop()}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
