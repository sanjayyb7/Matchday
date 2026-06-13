"use client";

import { use } from "react";
import Image from "next/image";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { ChatThread } from "@/components/chat/ChatThread";
import { ChatInput } from "@/components/chat/ChatInput";
import { ChatStoriesRow } from "@/components/chat/ChatStoriesRow";
import { ChatTeamBackground } from "@/components/chat/ChatTeamBackground";
import { useTeamChat } from "@/hooks/useTeamChat";
import { useAuth } from "@/hooks/useAuth";
import { useMatchdayStore } from "@/store/matchday-store";
import { getLiveOrUpcomingMatch, getTeam } from "@/lib/mock/data";
import { getTeamChatThemeFromTeam } from "@/lib/chat/team-theme";

export default function ChatPage({
  params,
}: {
  params: Promise<{ teamId: string }>;
}) {
  const { teamId } = use(params);
  const { user } = useAuth();
  const identity = useMatchdayStore((s) => s.identity);
  const match = getLiveOrUpcomingMatch();
  const team = getTeam(teamId);
  const matchId = match?.id ?? "match-spain-france";
  const { messages, sendMessage } = useTeamChat(teamId, matchId);
  const chatTheme = getTeamChatThemeFromTeam(team);

  const handleSend = (text: string) => {
    if (!user || !identity) return;
    sendMessage(text, user.id, identity.playerId);
  };

  return (
    <div className="relative flex h-[calc(100vh-5rem)] flex-col overflow-hidden bg-[#0B0F14]">
      <ChatTeamBackground team={team} />

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
            {messages.length > 0 ? `${messages.length} messages` : "No chats yet"}
            {match?.status === "live" && " · LIVE"}
          </p>
        </div>
      </header>

      <div className="relative z-10 flex min-h-0 flex-1 flex-col">
        <ChatStoriesRow messages={messages} teamId={teamId} team={team} />
        <ChatThread messages={messages} currentUserId={user?.id} team={team} />
        <ChatInput onSend={handleSend} disabled={!identity} team={team} />
      </div>
    </div>
  );
}
