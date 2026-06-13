"use client";

import { useState } from "react";
import { Camera, Send } from "lucide-react";
import { CHAT_TEMPLATES } from "@/lib/mock/simulatedFans";
import { getTeamChatThemeFromTeam } from "@/lib/chat/team-theme";
import type { Team } from "@/types";

interface ChatInputProps {
  onSend: (text: string) => void;
  disabled?: boolean;
  team?: Team;
}

export function ChatInput({ onSend, disabled, team }: ChatInputProps) {
  const [text, setText] = useState("");
  const chatTheme = getTeamChatThemeFromTeam(team);

  const handleSend = () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    onSend(trimmed);
    setText("");
  };

  return (
    <div className="relative z-10 bg-[#0B0F14]/85 px-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] pt-2 backdrop-blur-md">
      <div className="mb-2 flex gap-2 overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {CHAT_TEMPLATES.slice(0, 4).map((template) => (
          <button
            key={template}
            type="button"
            onClick={() => onSend(template)}
            disabled={disabled}
            className="shrink-0 rounded-full bg-white/10 px-3.5 py-1.5 text-xs font-medium text-white/70 transition-colors hover:bg-white/15 disabled:opacity-40"
          >
            {template}
          </button>
        ))}
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          disabled={disabled}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/10 text-white/60 disabled:opacity-40"
          aria-label="Camera"
        >
          <Camera className="h-5 w-5" />
        </button>
        <div className="flex flex-1 items-center rounded-full border border-white/10 bg-white/8 px-4 py-2 backdrop-blur-sm">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder="Send a chat..."
            disabled={disabled}
            className="w-full bg-transparent text-[15px] text-white placeholder:text-white/35 outline-none disabled:opacity-40"
          />
        </div>
        <button
          type="button"
          onClick={handleSend}
          disabled={disabled || !text.trim()}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-black shadow-sm transition-transform active:scale-95 disabled:opacity-30"
          style={{ backgroundColor: chatTheme.accent }}
          aria-label="Send"
        >
          <Send className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
