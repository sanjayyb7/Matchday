"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowUp } from "lucide-react";
import { QUICK_REPLIES } from "@/lib/mock/simulatedFans";
import {
  BOTTOM_NAV_CLEARANCE,
  BOTTOM_SAFE_CLEARANCE,
} from "@/lib/layout/constants";
import { uiTransition } from "@/lib/motion/tokens";
import { cn } from "@/lib/utils";
import type { OutgoingChatResult } from "@/lib/chat/safety";
import type { Team } from "@/types";

interface ChatInputProps {
  onSend: (text: string) => OutgoingChatResult | void;
  disabled?: boolean;
  team?: Team;
  /** Starter prompts — only useful before the user has said anything. */
  showQuickReplies?: boolean;
}

export function ChatInput({
  onSend,
  disabled,
  showQuickReplies = true,
}: ChatInputProps) {
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
              className="rounded-card border-2 border-ink bg-c-amber px-3.5 py-2.5 font-utility text-xs leading-snug text-ink"
            >
              {policyWarning}
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence initial={false}>
          {showQuickReplies && (
            <motion.div
              key="quick-replies"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={uiTransition(reduced, 0.18)}
              className="overflow-hidden"
            >
              {/* py-* keeps the pills' rounded edges and shadows clear of the
                  scroller, which clips vertically once overflow-x is set. */}
              <div className="flex gap-2 overflow-x-auto py-1.5 pr-4 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {QUICK_REPLIES.map((template) => {
                  const selected = text === template;
                  return (
                    <button
                      key={template}
                      type="button"
                      onClick={() => {
                        setText(template);
                        if (policyWarning) setPolicyWarning(null);
                      }}
                      disabled={disabled}
                      className={cn(
                        "press-pill micro-label min-h-11 shrink-0 rounded-pill border-[length:var(--border-quick)] px-3.5 transition-[background-color,color,transform] duration-[var(--dur-press)] ease-out disabled:opacity-40",
                        selected
                          ? "border-c-lime bg-c-lime text-ink"
                          : "border-ink bg-paper text-ink",
                      )}
                    >
                      {template}
                    </button>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex h-[var(--send-size)] items-center gap-2.5 overflow-hidden rounded-pill border-2 border-ink bg-paper pl-5 pr-2 focus-within:border-live">
          <input
            value={text}
            onChange={(e) => {
              setText(e.target.value);
              if (policyWarning) setPolicyWarning(null);
            }}
            onKeyDown={(e) => e.key === "Enter" && canSend && handleSend()}
            placeholder="Send a chat..."
            disabled={disabled}
            className="min-w-0 flex-1 self-stretch bg-transparent font-utility text-body text-ink placeholder:text-ink-muted outline-none disabled:opacity-40"
          />
          <AnimatePresence mode="popLayout">
            {canSend && (
              <motion.button
                key="send"
                type="button"
                onClick={handleSend}
                disabled={disabled}
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.5, opacity: 0 }}
                transition={
                  reduced
                    ? { duration: 0 }
                    : { duration: 0.18, ease: "easeOut" }
                }
                className="flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-c-lime text-ink disabled:opacity-40"
                aria-label="Send"
              >
                <ArrowUp className="h-5 w-5" strokeWidth={1.75} />
              </motion.button>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
