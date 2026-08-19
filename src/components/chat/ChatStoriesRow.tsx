"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { getPlayer, getTeam } from "@/lib/mock/data";
import { getTeamChatThemeFromTeam } from "@/lib/chat/team-theme";
import { useMatchdayStore } from "@/store/matchday-store";
import { useRealtime } from "@/lib/realtime/context";
import { INSFORGE_ENABLED } from "@/lib/insforge/config";
import { fetchSquadIdentities } from "@/lib/identity/insforge-identity";
import { cn } from "@/lib/utils";
import type { ChatMessage, FanPresence, Player, Team, UserIdentity } from "@/types";

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

  // Poll the identities table so both accounts see each other in the rail,
  // even if realtime presence hasn't published yet.
  useEffect(() => {
    if (!INSFORGE_ENABLED || !matchId || !teamId) return;
    let cancelled = false;

    const load = async () => {
      try {
        const rows = await fetchSquadIdentities(matchId, teamId);
        if (!cancelled) setSquadIdentities(rows);
      } catch (err) {
        console.error("[squad] failed to load identities", err);
      }
    };

    void load();
    const interval = window.setInterval(load, 8000);
    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [matchId, teamId]);

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

  const display: Player[] = [];
  const seen = new Set<string>();
  for (const playerId of joinedPlayerIds) {
    if (seen.has(playerId)) continue;
    const p = getPlayer(playerId);
    if (p) {
      display.push(p);
      seen.add(playerId);
    }
  }

  const sorted = display.sort((a, b) => {
    const aYou = identity?.playerId === a.id ? 0 : 1;
    const bYou = identity?.playerId === b.id ? 0 : 1;
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
        {sorted.map((player) => {
          const isYou = identity?.playerId === player.id;

          return (
            <button
              key={player.id}
              type="button"
              onClick={() => setSelectedPlayerProfile(player)}
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
                    src={player.imageUrl}
                    alt={player.name}
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
                {isYou ? "You" : player.name.split(" ").pop()}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
