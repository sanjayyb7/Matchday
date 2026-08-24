"use client";

import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";
import { getPlayer } from "@/lib/mock/data";
import { sanitizeChatText } from "@/lib/chat/safety";
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
  void team;

  // Keep the bubble aligned when a run of messages has no avatar of its own.
  const avatar = showAvatar ? (
    <button
      type="button"
      onClick={() => player && setSelectedPlayerProfile(player)}
      aria-label={player ? `View ${player.name}` : "View player"}
      className={cn(
        "relative mt-auto h-7 w-7 shrink-0 overflow-hidden rounded-full",
        isOwn ? "bg-c-lime" : "bg-paper",
      )}
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
  ) : (
    <div className="h-7 w-7 shrink-0" aria-hidden />
  );

  return (
    <motion.div
      className={cn("flex w-full gap-2", isOwn ? "justify-end" : "justify-start")}
      initial="initial"
      animate="animate"
      variants={enterVariants(reduced)}
      layout={false}
    >
      {!isOwn && avatar}
      <div className={cn("flex max-w-[78%] flex-col", isOwn ? "items-end" : "items-start")}>
        {showAvatar && (
          <span className="micro-label mb-1 px-1 text-chat-muted">
            {isOwn ? "You" : (player?.name.split(" ").pop() ?? "Fan")}
          </span>
        )}
        <button
          type="button"
          onClick={() => player && setSelectedPlayerProfile(player)}
          className={cn(
            "chat-bubble inline-block max-w-full rounded-[18px] px-4 py-2.5 text-left font-utility text-body whitespace-pre-wrap break-words transition-[filter] duration-[var(--dur-press)] ease-out active:brightness-[0.97]",
            isOwn ? "bg-c-lime text-ink" : "bg-chat-incoming text-chat-text",
          )}
          style={{
            textAlign: "left",
          }}
        >
          <span className="block text-left">
            {sanitizeChatText(message.text)}
          </span>
        </button>
      </div>
      {isOwn && avatar}
    </motion.div>
  );
}
