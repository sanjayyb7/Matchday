"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Map, Shirt, User } from "lucide-react";
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
  const { user } = useAuth();
  const identity = useMatchdayStore((s) => s.identity);
  const hasActiveIdentity = isIdentityStillActive(identity, user?.id);
  const chatHref = hasActiveIdentity ? `/chat/${identity!.teamId}` : "/chat";

  const resolvedTabs = tabs.map((tab) =>
    tab.href === "/chat" ? { ...tab, href: chatHref, id: "/chat" } : { ...tab, id: tab.href },
  );

  if (/^\/chat\/[^/]+/.test(pathname)) return null;

  return (
    <nav className="pointer-events-none fixed bottom-0 left-0 right-0 z-50 bg-ink pb-[env(safe-area-inset-bottom)]">
      <div className="pointer-events-auto grid grid-cols-3">
        {resolvedTabs.map(({ id, href, icon: Icon, label }) => {
          const active = pathname.startsWith(id);
          return (
            <Link
              key={id}
              href={href}
              className="flex min-h-14 items-center justify-center transition-transform duration-[var(--duration-press)] ease-out active:scale-95"
              aria-label={label}
              aria-current={active ? "page" : undefined}
            >
              <Icon
                className={cn(
                  "h-6 w-6",
                  active ? "text-c-lime" : "text-paper",
                )}
                strokeWidth={active ? 1.75 : 1.5}
              />
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
