"use client";

import { use, useEffect } from "react";
import Image from "next/image";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChatThread } from "@/components/chat/ChatThread";
import { ChatInput } from "@/components/chat/ChatInput";
import { ChatStoriesRow } from "@/components/chat/ChatStoriesRow";
import { useTeamChat } from "@/hooks/useTeamChat";
import { useAuth } from "@/hooks/useAuth";
import { useMatchdayStore } from "@/store/matchday-store";
import {
  getLiveOrUpcomingMatch,
  getMatchLabel,
  getTeam,
  getDerivedMatchStatus,
  identityMatchesActiveMatch,
} from "@/lib/mock/data";
import { getTeamChatThemeFromTeam } from "@/lib/chat/team-theme";
import { CHAT_INPUT_CLEARANCE } from "@/lib/layout/constants";

export default function ChatPage({
  params,
}: {
  params: Promise<{ teamId: string }>;
}) {
  const { teamId } = use(params);
  const router = useRouter();
  const { user } = useAuth();
  const identity = useMatchdayStore((s) => s.identity);
  const match = getLiveOrUpcomingMatch();
  const team = getTeam(teamId);
  const matchId = match?.id ?? "match-spain-france";
  const { messages, sendMessage } = useTeamChat(teamId, matchId);
  const chatTheme = getTeamChatThemeFromTeam(team);

  const hasActiveIdentity = identityMatchesActiveMatch(identity, user?.id, match);

  useEffect(() => {
    if (!user || !match) return;
    if (!hasActiveIdentity) {
      router.replace("/chat");
      return;
    }
    if (identity && identity.teamId !== teamId) {
      router.replace(`/chat/${identity.teamId}`);
    }
  }, [user, match, hasActiveIdentity, identity, teamId, router]);

  const handleSend = (text: string) => {
    if (!user || !identity || !hasActiveIdentity) {
      return {
        ok: false as const,
        warning: "Join a match squad before chatting.",
      };
    }
    return sendMessage(text, user.id, identity.playerId);
  };

  const matchLabel = match ? getMatchLabel(match) : null;

  return (
    <div className="relative flex h-dvh flex-col overflow-hidden bg-[#0B0F14]">
      <header className="relative z-10 flex items-center gap-3 border-b border-white/10 bg-[#0B0F14]/80 px-3 py-3 backdrop-blur-md">
        <Link
          href="/map"
          className="flex h-9 w-9 items-center justify-center rounded-full text-white/70 hover:bg-white/10"
        >
          <ChevronLeft className="h-5 w-5" />
        </Link>
        {team && (
          <div
            className="relative h-10 w-10 overflow-hidden rounded-full ring-2 ring-[#F1BF00]"
            style={{ boxShadow: `0 0 0 2px ${chatTheme.accent}` }}
          >
            <Image src={team.flagUrl} alt={team.name} fill className="object-cover" />
          </div>
        )}
        <div className="flex-1">
          <h1 className="font-heading text-base font-bold text-white">
            {team?.name ?? "Team"} Squad
          </h1>
          <p className="text-xs text-white/50">
            {matchLabel
              ? `${matchLabel}${match && getDerivedMatchStatus(match) === "live" ? " · LIVE" : ""}`
              : messages.length > 0
                ? `${messages.length} messages`
                : "No chats yet"}
          </p>
        </div>
      </header>

      <div
        className="relative z-10 flex min-h-0 flex-1 flex-col"
        style={{ paddingBottom: CHAT_INPUT_CLEARANCE }}
      >
        <ChatStoriesRow messages={messages} teamId={teamId} team={team} />
        <ChatThread messages={messages} currentUserId={user?.id} team={team} />
      </div>
      <ChatInput
        onSend={handleSend}
        disabled={!hasActiveIdentity}
        team={team}
      />
    </div>
  );
}
