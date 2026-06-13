"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Map, MessageCircle, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { useMatchdayStore } from "@/store/matchday-store";

const tabs = [
  { href: "/map", icon: Map },
  { href: "/chat", icon: MessageCircle },
  { href: "/profile", icon: User },
];

export function BottomNav() {
  const pathname = usePathname();
  const identity = useMatchdayStore((s) => s.identity);
  const chatHref = identity ? `/chat/${identity.teamId}` : "/chat/spain";

  const resolvedTabs = tabs.map((tab) =>
    tab.href === "/chat" ? { ...tab, href: chatHref } : tab,
  );

  return (
    <nav className="pointer-events-none fixed bottom-0 left-0 right-0 z-50 px-4 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
      <div className="pointer-events-auto flex w-full items-center justify-around rounded-full bg-[#141a22]/90 px-6 py-2.5 shadow-lg shadow-black/40 ring-1 ring-white/10 backdrop-blur-xl">
        {resolvedTabs.map(({ href, icon: Icon }) => {
          const active = pathname.startsWith(href.split("/").slice(0, 2).join("/"));
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex h-11 w-11 flex-1 max-w-[72px] items-center justify-center rounded-full transition-all",
                active && "bg-white/15 text-[#F1BF00] shadow-sm",
                !active && "text-white/45 hover:bg-white/10",
              )}
              aria-label={href}
            >
              <Icon className="h-5 w-5" strokeWidth={active ? 2.5 : 2} />
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
