"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import { getPlayer, getTeam } from "@/lib/mock/data";
import { getTeamChatThemeFromTeam } from "@/lib/chat/team-theme";
import { useMatchdayStore } from "@/store/matchday-store";
import { useRealtime } from "@/lib/realtime/context";
import { INSFORGE_ENABLED } from "@/lib/insforge/config";
import { fetchSquadIdentities } from "@/lib/identity/insforge-identity";
import { cn } from "@/lib/utils";
import type { ChatMessage, FanPresence, Player, Team, UserIdentity } from "@/types";

type SquadMember = {
  playerId: string;
  /** Missing when the squad hasn't loaded, or the pick predates a roster refresh. */
  player?: Player;
};

function fallbackAvatar(playerId: string, team?: Team): string {
  const color = (team?.color ?? "#FFFC00").replace("#", "");
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
    const interval = window.setInterval(() => void loadSquad(), 8000);
    return () => window.clearInterval(interval);
  }, [loadSquad]);

  // A message from someone new means the roster changed — pull it immediately
  // rather than waiting out the poll.
  useEffect(() => {
    void loadSquad();
  }, [messages.length, presence.length, loadSquad]);

  const resolvedTeam = team ?? getTeam(teamId);
  const chatTheme = getTeamChatThemeFromTeam(resolvedTeam);

  // Only real fans who joined this squad show up. Sources of truth:
  //  1. `user_identities` rows for this match+team (authoritative — anyone who
  //     picked a player is here, even if they never opened the map).
  //  2. Realtime presence for this team (fresh joiners between polls).
  //  3. Current user's identity (immediate self-display).
  //  4. Chat participants (safety net).
  const joinedPlayerIds = new Set<string>();
  for (const row of squadIdentities) {
    joinedPlayerIds.add(row.playerId);
  }
  for (const p of presence) {
    if (p.teamId === teamId) joinedPlayerIds.add(p.playerId);
  }
  if (identity?.teamId === teamId && identity.playerId) {
    joinedPlayerIds.add(identity.playerId);
  }
  for (const msg of messages) {
    if (msg.teamId === teamId) joinedPlayerIds.add(msg.playerId);
  }

  // Keep everyone who joined, even when their player isn't in the loaded
  // roster — dropping them made real teammates invisible.
  const display: SquadMember[] = [];
  const seen = new Set<string>();
  for (const playerId of joinedPlayerIds) {
    if (!playerId || seen.has(playerId)) continue;
    seen.add(playerId);
    display.push({ playerId, player: getPlayer(playerId) });
  }

  const sorted = display.sort((a, b) => {
    const aYou = identity?.playerId === a.playerId ? 0 : 1;
    const bYou = identity?.playerId === b.playerId ? 0 : 1;
    return aYou - bYou;
  });

  return (
    <div className="px-4 py-3">
      <p className="mb-2.5 text-[11px] font-semibold uppercase tracking-widest text-white/45">
        Live squad {sorted.length > 0 ? `· ${sorted.length}` : ""}
      </p>
      <div className="flex gap-3 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {sorted.length === 0 && (
          <p className="text-xs text-white/45">
            No teammates in yet — invite a friend.
          </p>
        )}
        {sorted.map(({ playerId, player }) => {
          const isYou = identity?.playerId === playerId;
          const name = player?.name ?? "Fan";

          return (
            <button
              key={playerId}
              type="button"
              disabled={!player}
              onClick={() => player && setSelectedPlayerProfile(player)}
              className="flex shrink-0 flex-col items-center gap-1.5"
            >
              <div
                className="rounded-full p-[2.5px]"
                style={{
                  background: `linear-gradient(135deg, ${chatTheme.accent}, ${chatTheme.accentMuted})`,
                }}
              >
                <div className="relative h-14 w-14 overflow-hidden rounded-full border-2 border-[#0B0F14] bg-[#0B0F14]">
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
                  "max-w-[56px] truncate text-[10px] font-medium",
                  isYou ? "text-[#FFFC00]" : "text-white/75",
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
