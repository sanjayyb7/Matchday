"use client";

import { useEffect, useRef } from "react";
import { ChatBubble } from "./ChatBubble";
import type { ChatMessage, Team } from "@/types";

interface ChatThreadProps {
  messages: ChatMessage[];
  currentUserId?: string;
  team?: Team;
  /** Space for the overlaid squad rail so the first message clears it. */
  topInset?: number | string;
  /** Space for the floating input so the last message clears it. */
  bottomInset?: number | string;
}

export function ChatThread({
  messages,
  currentUserId,
  team,
  topInset = 0,
  bottomInset = 0,
}: ChatThreadProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div
      className="h-full overflow-y-auto px-4 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      style={{ paddingTop: topInset, paddingBottom: bottomInset }}
    >
      <div className="flex flex-col gap-3">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-white/10 text-2xl backdrop-blur-sm">
              👋
            </div>
            <p className="text-sm font-semibold text-white/80">Say hey to your squad</p>
            <p className="mt-1 max-w-[220px] text-xs text-white/45">
              Tap a quick reply below or send your first message
            </p>
          </div>
        ) : (
          messages.map((msg, i) => {
            const prev = messages[i - 1];
            // Show the sender's avatar on the first message of each run, on
            // both sides, so you can always tell who a message came from.
            const showAvatar = !prev || prev.userId !== msg.userId;
            return (
              <ChatBubble
                key={msg.id}
                message={msg}
                isOwn={msg.userId === currentUserId}
                showAvatar={showAvatar}
                team={team}
              />
            );
          })
        )}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
