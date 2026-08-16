"use client";

import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";
import { getPlayer } from "@/lib/mock/data";
import { sanitizeChatText } from "@/lib/chat/safety";
import { getTeamChatThemeFromTeam } from "@/lib/chat/team-theme";
import { enterVariants } from "@/lib/motion/tokens";
import { useMatchdayStore } from "@/store/matchday-store";
import type { ChatMessage, Team } from "@/types";
import { cn } from "@/lib/utils";

interface ChatBubbleProps {
  message: ChatMessage;
  isOwn: boolean;
  showAvatar?: boolean;
  team?: Team;
}

export function ChatBubble({ message, isOwn, showAvatar = false, team }: ChatBubbleProps) {
  const reduced = useReducedMotion() ?? false;
  const player = getPlayer(message.playerId);
  const setSelectedPlayerProfile = useMatchdayStore(
    (s) => s.setSelectedPlayerProfile,
  );
  const chatTheme = getTeamChatThemeFromTeam(team);

  return (
    <motion.div
      className={cn("flex w-full gap-2", isOwn ? "justify-end" : "justify-start")}
      initial="initial"
      animate="animate"
      variants={enterVariants(reduced)}
      layout={false}
    >
      {!isOwn && showAvatar && (
        <button
          type="button"
          onClick={() => player && setSelectedPlayerProfile(player)}
          className="relative mt-auto h-7 w-7 shrink-0 overflow-hidden rounded-full ring-1 ring-white/20"
        >
          {player && (
            <Image
              src={player.imageUrl}
              alt=""
              width={28}
              height={28}
              className="h-full w-full object-cover"
              unoptimized
            />
          )}
        </button>
      )}
      <div className={cn("flex max-w-[78%] flex-col", isOwn ? "items-end" : "items-start")}>
        {!isOwn && (
          <span className="mb-1 px-1 text-[11px] font-medium text-white/50">
            {player?.name.split(" ").pop() ?? "Fan"}
          </span>
        )}
        <button
          type="button"
          onClick={() => player && setSelectedPlayerProfile(player)}
          className={cn(
            "px-4 py-2.5 text-[15px] leading-snug transition-transform duration-150 ease-[var(--ease-out-strong)] active:scale-[0.97]",
            isOwn
              ? "rounded-[22px] rounded-br-md text-black shadow-md"
              : "rounded-[22px] rounded-bl-md bg-white/12 text-white backdrop-blur-sm",
          )}
          style={
            isOwn
              ? { backgroundColor: chatTheme.accent }
              : undefined
          }
        >
          {sanitizeChatText(message.text)}
        </button>
      </div>
    </motion.div>
  );
}
