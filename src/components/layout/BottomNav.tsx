"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, useReducedMotion } from "framer-motion";
import { Map, Shirt, User } from "lucide-react";
import { uiTransition } from "@/lib/motion/tokens";
import { cn } from "@/lib/utils";
import { useMatchdayStore } from "@/store/matchday-store";
import { useAuth } from "@/hooks/useAuth";
import { isIdentityStillActive } from "@/lib/mock/data";

const tabs = [
  { href: "/map", icon: Map, label: "Map" },
  // Jersey = pick team/player so your fan marker shows on the map
  { href: "/chat", icon: Shirt, label: "Pick your side" },
  { href: "/profile", icon: User, label: "Profile" },
];

export function BottomNav() {
  const pathname = usePathname();
  const reduced = useReducedMotion() ?? false;
  const { user } = useAuth();
  const identity = useMatchdayStore((s) => s.identity);
  const hasActiveIdentity = isIdentityStillActive(identity, user?.id);
  const chatHref = hasActiveIdentity ? `/chat/${identity!.teamId}` : "/chat";

  const resolvedTabs = tabs.map((tab) =>
    tab.href === "/chat" ? { ...tab, href: chatHref } : tab,
  );

  if (/^\/chat\/[^/]+/.test(pathname)) return null;

  return (
    <nav className="pointer-events-none fixed bottom-0 left-0 right-0 z-50 flex justify-center px-4 pb-[calc(0.75rem+env(safe-area-inset-bottom))] pt-2">
      <div className="pointer-events-auto flex w-full max-w-[230px] items-center justify-between rounded-full bg-black/30 p-1 shadow-[0_8px_32px_rgba(0,0,0,0.45)] ring-1 ring-white/15 backdrop-blur-2xl">
        {resolvedTabs.map(({ href, icon: Icon, label }) => {
          const active = pathname.startsWith(href.split("/").slice(0, 2).join("/"));
          return (
            <motion.div
              key={href}
              transition={uiTransition(reduced, 0.2)}
              className="flex shrink-0"
            >
              <Link
                href={href}
                className={cn(
                  "flex h-12 w-12 shrink-0 items-center justify-center rounded-full transition-[background-color,color] duration-200 ease-[var(--ease-out-strong)] active:scale-[0.97]",
                  active
                    ? "bg-[#FFFC00] text-black"
                    : "text-white/70 hover:bg-white/10 hover:text-white",
                )}
                aria-label={label}
              >
                <Icon className="h-6 w-6" strokeWidth={active ? 1.75 : 1.5} />
              </Link>
            </motion.div>
          );
        })}
      </div>
    </nav>
  );
}
