"use client";

import { usePathname } from "next/navigation";
import {
  Sheet,
  SheetContent,
} from "@/components/ui/sheet";
import { MatchSelectionPanel } from "./MatchSelectionPanel";
import { useMatchdayStore } from "@/store/matchday-store";
import { useAuth } from "@/hooks/useAuth";
import { useMatchIdentity, dismissMatchReminder } from "@/hooks/useMatchIdentity";
import {
  getLiveOrUpcomingMatch,
  identityMatchesActiveMatch,
  matches,
} from "@/lib/mock/data";
import {
  canPromptTeamSelection,
  isTeamSelectionOpen,
} from "@/lib/matches/match-window";

export function MatchReminderSheet() {
  const pathname = usePathname();
  const { user } = useAuth();
  const showMatchReminder = useMatchdayStore((s) => s.showMatchReminder);
  const closeMatchReminder = useMatchdayStore((s) => s.closeMatchReminder);
  const identity = useMatchdayStore((s) => s.identity);

  useMatchIdentity(user?.id);

  const activeMatch = getLiveOrUpcomingMatch();
  const onChatPage = pathname.startsWith("/chat");
  const hasIdentity = identityMatchesActiveMatch(identity, user?.id, activeMatch);
  const canPrompt = activeMatch
    ? canPromptTeamSelection(activeMatch, matches)
    : false;
  const inSelectionWindow =
    activeMatch && isTeamSelectionOpen(activeMatch) && canPrompt;

  const open =
    showMatchReminder &&
    !onChatPage &&
    !hasIdentity &&
    !!inSelectionWindow &&
    !!activeMatch;

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen && activeMatch) {
      dismissMatchReminder(activeMatch.id);
      closeMatchReminder();
    }
  };

  if (!activeMatch) return null;

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent
        side="bottom"
        elevated
        className="flex max-h-[90vh] flex-col gap-0 rounded-t-3xl border-white/10 bg-[#0B0F14] px-0 pb-[max(1rem,env(safe-area-inset-bottom))] pt-2"
      >
        <MatchSelectionPanel match={activeMatch} embedded />
      </SheetContent>
    </Sheet>
  );
}
