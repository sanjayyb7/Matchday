"use client";

import Image from "next/image";
import { getTeamChatThemeFromTeam } from "@/lib/chat/team-theme";
import type { Team } from "@/types";

interface ChatTeamBackgroundProps {
  team?: Team;
}

export function ChatTeamBackground({ team }: ChatTeamBackgroundProps) {
  const chatTheme = getTeamChatThemeFromTeam(team);

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <div
        className="absolute inset-0"
        style={{ background: chatTheme.stripes }}
      />
      <div className="absolute inset-0 bg-[#0B0F14]/75" />
      <div className="absolute inset-0 flex items-center justify-center opacity-[0.07]">
        <div className="relative h-48 w-72 sm:h-56 sm:w-80">
          <Image
            src={chatTheme.watermark}
            alt=""
            fill
            className="object-contain"
            aria-hidden
          />
        </div>
      </div>
    </div>
  );
}
