"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Send } from "lucide-react";
import { CHAT_TEMPLATES } from "@/lib/mock/simulatedFans";
import {
  BOTTOM_NAV_CLEARANCE,
  BOTTOM_SAFE_CLEARANCE,
} from "@/lib/layout/constants";
import { enterVariants, uiTransition } from "@/lib/motion/tokens";
import type { Team } from "@/types";

interface ChatInputProps {
  onSend: (text: string) => void;
  disabled?: boolean;
  team?: Team;
}

export function ChatInput({ onSend, disabled, team }: ChatInputProps) {
  const [text, setText] = useState("");
  const pathname = usePathname();
  const reduced = useReducedMotion() ?? false;
  const bottomInset = pathname.startsWith("/chat")
    ? BOTTOM_SAFE_CLEARANCE
    : BOTTOM_NAV_CLEARANCE;

  const canSend = text.trim().length > 0;

  const handleSend = () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    onSend(trimmed);
    setText("");
  };

  return (
    <div
      className="pointer-events-none fixed bottom-0 left-0 right-0 z-40 px-4 pt-2"
      style={{ paddingBottom: bottomInset }}
    >
      <div className="pointer-events-auto mx-auto w-full max-w-md space-y-2">
        <div className="flex gap-2 overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {CHAT_TEMPLATES.slice(0, 4).map((template) => (
            <button
              key={template}
              type="button"
              onClick={() => onSend(template)}
              disabled={disabled}
              className="shrink-0 rounded-full bg-[#141a22]/75 px-3.5 py-1.5 text-xs font-medium text-white/70 shadow-md ring-1 ring-white/10 backdrop-blur-xl transition-[background-color,transform] duration-150 ease-[var(--ease-out-strong)] hover:bg-[#141a22]/90 active:scale-[0.97] disabled:opacity-40"
            >
              {template}
            </button>
          ))}
        </div>

        <div className="flex min-h-[52px] items-center gap-2.5 rounded-full bg-[#141a22]/75 py-2.5 pl-5 pr-2 shadow-[0_8px_32px_rgba(0,0,0,0.45)] ring-1 ring-white/10 backdrop-blur-xl">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && canSend && handleSend()}
            placeholder="Send a chat..."
            disabled={disabled}
            className="min-w-0 flex-1 bg-transparent text-[17px] leading-snug text-white placeholder:text-white/35 outline-none disabled:opacity-40"
          />
          <AnimatePresence mode="popLayout">
            {canSend && (
              <motion.button
                key="send"
                type="button"
                onClick={handleSend}
                disabled={disabled}
                initial="initial"
                animate="animate"
                exit="exit"
                variants={enterVariants(reduced)}
                transition={uiTransition(reduced, 0.16)}
                whileTap={reduced ? undefined : { scale: 0.97 }}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[#FFFC00] disabled:opacity-40"
                aria-label="Send"
              >
                <Send className="h-5 w-5" strokeWidth={2.5} />
              </motion.button>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
