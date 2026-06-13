"use client";

import { useEffect, useRef } from "react";
import { ChatBubble } from "./ChatBubble";
import type { ChatMessage, Team } from "@/types";

interface ChatThreadProps {
  messages: ChatMessage[];
  currentUserId?: string;
  team?: Team;
}

export function ChatThread({ messages, currentUserId, team }: ChatThreadProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="flex-1 overflow-y-auto px-4 py-3">
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
            const showAvatar =
              msg.userId !== currentUserId &&
              (!prev || prev.userId !== msg.userId);
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
