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

  const onPicker = pathname === "/chat";

  return (
    <nav className="pointer-events-none fixed inset-x-0 bottom-0 z-50">
      {!onPicker && (
        <div
          aria-hidden
          className="absolute inset-x-0 bottom-0 h-[calc(var(--list-clearance)+env(safe-area-inset-bottom))]"
          style={{
            WebkitBackdropFilter: "blur(16px)",
            backdropFilter: "blur(16px)",
            WebkitMaskImage:
              "linear-gradient(to top, black 0%, rgba(0,0,0,0.55) 42%, transparent 100%)",
            maskImage:
              "linear-gradient(to top, black 0%, rgba(0,0,0,0.55) 42%, transparent 100%)",
          }}
        />
      )}
      <div
        className="relative flex justify-center"
        style={{
          paddingBottom: "calc(var(--tab-offset) + env(safe-area-inset-bottom))",
        }}
      >
        <div
          className="pointer-events-auto flex items-center rounded-pill bg-ink"
          style={{
            padding: "var(--tab-pad)",
            boxShadow: "var(--shadow-tab)",
          }}
        >
          {resolvedTabs.map(({ id, href, icon: Icon, label }) => {
            const active = pathname.startsWith(id);
            return (
              <Link
                key={id}
                href={href}
                aria-label={label}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "press-pill focus-visible-live flex min-h-11 min-w-11 items-center justify-center overflow-hidden rounded-pill",
                  "transition-[max-width,gap,padding,background-color] duration-[var(--dur-ui)] ease-out",
                  active
                    ? "gap-2 bg-c-lime px-3.5 text-ink"
                    : "px-0 text-paper/55",
                )}
              >
                <Icon className="size-5 shrink-0" strokeWidth={active ? 2.25 : 1.75} />
                <span
                  className={cn(
                    "overflow-hidden whitespace-nowrap font-utility text-tab font-semibold uppercase tracking-[var(--micro-tracking)]",
                    "transition-[max-width,opacity] duration-[var(--dur-ui)] ease-out",
                    active ? "max-w-[9rem] opacity-100" : "max-w-0 opacity-0",
                  )}
                >
                  {label}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
