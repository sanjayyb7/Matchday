"use client";

import Image from "next/image";
import { getPlayer, getPlayersByTeam, getTeam } from "@/lib/mock/data";
import { getTeamChatThemeFromTeam } from "@/lib/chat/team-theme";
import { useMatchdayStore } from "@/store/matchday-store";
import { cn } from "@/lib/utils";
import type { ChatMessage, Player, Team } from "@/types";

interface ChatStoriesRowProps {
  messages: ChatMessage[];
  teamId: string;
  team?: Team;
}

export function ChatStoriesRow({ messages, teamId, team }: ChatStoriesRowProps) {
  const identity = useMatchdayStore((s) => s.identity);
  const setSelectedPlayerProfile = useMatchdayStore(
    (s) => s.setSelectedPlayerProfile,
  );

  const resolvedTeam = team ?? getTeam(teamId);
  const chatTheme = getTeamChatThemeFromTeam(resolvedTeam);

  // Whole roster in the rail so you see the squad, not just chat participants.
  const roster = getPlayersByTeam(teamId);

  const activePlayerIds = new Set<string>();
  if (identity?.playerId) activePlayerIds.add(identity.playerId);
  for (const msg of messages) activePlayerIds.add(msg.playerId);

  // Build the display list. Guarantee identity + chat participants are shown
  // even if the roster hasn't hydrated yet, so "You" never disappears.
  const display: Player[] = [...roster];
  const seenIds = new Set(display.map((p) => p.id));
  for (const playerId of activePlayerIds) {
    if (seenIds.has(playerId)) continue;
    const p = getPlayer(playerId);
    if (p) {
      display.push(p);
      seenIds.add(p.id);
    }
  }

  const sorted = display.sort((a, b) => {
    const aYou = identity?.playerId === a.id ? 0 : 1;
    const bYou = identity?.playerId === b.id ? 0 : 1;
    if (aYou !== bYou) return aYou - bYou;
    const aActive = activePlayerIds.has(a.id) ? 0 : 1;
    const bActive = activePlayerIds.has(b.id) ? 0 : 1;
    if (aActive !== bActive) return aActive - bActive;
    return 0;
  });

  return (
    <div className="px-4 py-3">
      <p className="mb-2.5 text-[11px] font-semibold uppercase tracking-widest text-white/45">
        Live squad {roster.length > 0 ? `· ${roster.length}` : ""}
      </p>
      <div className="flex gap-3 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {sorted.length === 0 && (
          <p className="text-xs text-white/45">
            Squad details are still loading.
          </p>
        )}
        {sorted.map((player) => {
          const isYou = identity?.playerId === player.id;
          const isActive = activePlayerIds.has(player.id);

          return (
            <button
              key={player.id}
              type="button"
              onClick={() => setSelectedPlayerProfile(player)}
              className="flex shrink-0 flex-col items-center gap-1.5"
            >
              <div
                className={cn(
                  "rounded-full p-[2.5px] transition-opacity",
                  !isActive && "opacity-60",
                )}
                style={{
                  background: isActive
                    ? `linear-gradient(135deg, ${chatTheme.accent}, ${chatTheme.accentMuted})`
                    : "rgba(255,255,255,0.15)",
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
