"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Send } from "lucide-react";
import { QUICK_REPLIES } from "@/lib/mock/simulatedFans";
import {
  BOTTOM_NAV_CLEARANCE,
  BOTTOM_SAFE_CLEARANCE,
} from "@/lib/layout/constants";
import { enterVariants, uiTransition } from "@/lib/motion/tokens";
import type { OutgoingChatResult } from "@/lib/chat/safety";
import type { Team } from "@/types";

interface ChatInputProps {
  onSend: (text: string) => OutgoingChatResult | void;
  disabled?: boolean;
  team?: Team;
}

export function ChatInput({ onSend, disabled }: ChatInputProps) {
  const [text, setText] = useState("");
  const [policyWarning, setPolicyWarning] = useState<string | null>(null);
  const pathname = usePathname();
  const reduced = useReducedMotion() ?? false;
  const bottomInset = pathname.startsWith("/chat")
    ? BOTTOM_SAFE_CLEARANCE
    : BOTTOM_NAV_CLEARANCE;

  const canSend = text.trim().length > 0;

  useEffect(() => {
    if (!policyWarning) return;
    const timer = window.setTimeout(() => setPolicyWarning(null), 6000);
    return () => window.clearTimeout(timer);
  }, [policyWarning]);

  const submit = (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) return;
    const result = onSend(trimmed);
    if (result && !result.ok) {
      setPolicyWarning(result.warning);
      return;
    }
    setPolicyWarning(null);
    setText("");
  };

  const handleSend = () => submit(text);

  return (
    <div
      className="pointer-events-none fixed bottom-0 left-0 right-0 z-40 px-4 pt-2"
      style={{ paddingBottom: bottomInset }}
    >
      <div className="pointer-events-auto mx-auto w-full max-w-md space-y-2">
        <AnimatePresence>
          {policyWarning && (
            <motion.div
              key="policy-warning"
              role="alert"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 4 }}
              className="rounded-2xl border border-amber-400/35 bg-amber-500/15 px-3.5 py-2.5 text-xs leading-snug text-amber-50 shadow-lg backdrop-blur-xl"
            >
              {policyWarning}
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex gap-2 overflow-x-auto pr-4 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {QUICK_REPLIES.map((template) => (
            <button
              key={template}
              type="button"
              onClick={() => submit(template)}
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
            onChange={(e) => {
              setText(e.target.value);
              if (policyWarning) setPolicyWarning(null);
            }}
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
