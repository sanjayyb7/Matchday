"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, useReducedMotion } from "framer-motion";
import { Map, MessageCircle, User } from "lucide-react";
import { uiTransition } from "@/lib/motion/tokens";
import { cn } from "@/lib/utils";
import { useMatchdayStore } from "@/store/matchday-store";
import { useAuth } from "@/hooks/useAuth";
import {
  getLiveOrUpcomingMatch,
  identityMatchesActiveMatch,
} from "@/lib/mock/data";

const tabs = [
  { href: "/map", icon: Map },
  { href: "/chat", icon: MessageCircle },
  { href: "/profile", icon: User },
];

export function BottomNav() {
  const pathname = usePathname();
  const reduced = useReducedMotion() ?? false;
  const { user } = useAuth();
  const identity = useMatchdayStore((s) => s.identity);
  const activeMatch = getLiveOrUpcomingMatch();
  const hasActiveIdentity = identityMatchesActiveMatch(
    identity,
    user?.id,
    activeMatch,
  );
  const chatHref = hasActiveIdentity ? `/chat/${identity!.teamId}` : "/chat";

  const resolvedTabs = tabs.map((tab) =>
    tab.href === "/chat" ? { ...tab, href: chatHref } : tab,
  );

  if (/^\/chat\/[^/]+/.test(pathname)) return null;

  return (
    <nav className="pointer-events-none fixed bottom-0 left-0 right-0 z-50 px-4 pb-[calc(0.75rem+env(safe-area-inset-bottom))] pt-2">
      <div className="pointer-events-auto mx-auto flex w-full max-w-md items-center justify-around rounded-full bg-[#141a22]/75 px-6 py-2.5 shadow-[0_8px_32px_rgba(0,0,0,0.45)] ring-1 ring-white/10 backdrop-blur-xl">
        {resolvedTabs.map(({ href, icon: Icon }) => {
          const active = pathname.startsWith(href.split("/").slice(0, 2).join("/"));
          return (
            <motion.div
              key={href}
              layout={!reduced}
              transition={uiTransition(reduced, 0.2)}
              className="flex shrink-0"
            >
              <Link
                href={href}
                className={cn(
                  "flex h-11 shrink-0 items-center justify-center rounded-full transition-[background-color,color,box-shadow] duration-200 ease-[var(--ease-out-strong)] active:scale-[0.97]",
                  active && "min-w-[72px] bg-white/15 px-5 text-[#F1BF00] shadow-sm",
                  !active && "w-11 text-white/45 hover:bg-white/10",
                )}
                aria-label={href}
              >
                <Icon className="h-5 w-5" strokeWidth={active ? 2.5 : 2} />
              </Link>
            </motion.div>
          );
        })}
      </div>
    </nav>
  );
}
