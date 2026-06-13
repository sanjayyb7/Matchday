"use client";

import Image from "next/image";
import { getPlayer, getTeam } from "@/lib/mock/data";
import { getTeamChatThemeFromTeam } from "@/lib/chat/team-theme";
import { useMatchdayStore } from "@/store/matchday-store";
import type { ChatMessage, Team } from "@/types";

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

  const playerIds = new Set<string>();
  if (identity?.playerId) playerIds.add(identity.playerId);
  for (const msg of messages) playerIds.add(msg.playerId);
  const fans = Array.from(playerIds).slice(0, 8);

  const resolvedTeam = team ?? getTeam(teamId);
  const chatTheme = getTeamChatThemeFromTeam(resolvedTeam);

  return (
    <div className="border-b border-white/10 bg-[#0B0F14]/60 px-4 py-3 backdrop-blur-sm">
      <p className="mb-2.5 text-[11px] font-semibold uppercase tracking-widest text-white/45">
        Live squad
      </p>
      <div className="flex gap-3 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {fans.map((playerId) => {
          const player = getPlayer(playerId);
          if (!player) return null;
          const isYou = identity?.playerId === playerId;

          return (
            <button
              key={playerId}
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
              <span className="max-w-[56px] truncate text-[10px] font-medium text-white/75">
                {isYou ? "You" : player.name.split(" ").pop()}
              </span>
            </button>
          );
        })}
        {fans.length === 0 && (
          <p className="text-xs text-white/45">Pick a player to join the squad</p>
        )}
      </div>
    </div>
  );
}
