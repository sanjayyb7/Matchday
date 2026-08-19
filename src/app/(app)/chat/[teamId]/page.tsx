"use client";

import { use, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { ChevronLeft, MoreHorizontal } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChatThread } from "@/components/chat/ChatThread";
import { ChatInput } from "@/components/chat/ChatInput";
import { ChatStoriesRow } from "@/components/chat/ChatStoriesRow";
import { useTeamChat } from "@/hooks/useTeamChat";
import { useAuth } from "@/hooks/useAuth";
import { useMatchdayStore } from "@/store/matchday-store";
import { useRealtime } from "@/lib/realtime/context";
import { INSFORGE_ENABLED } from "@/lib/insforge/config";
import {
  deleteUserIdentityForMatch,
  upsertUserIdentity,
} from "@/lib/identity/insforge-identity";
import {
  getLiveOrUpcomingMatch,
  getMatch,
  getMatchLabel,
  getPlayersByTeam,
  getTeam,
  getDerivedMatchStatus,
  mergeMatchSquads,
} from "@/lib/mock/data";
import { generateFallbackSquad } from "@/lib/matches/squad-fallback";
import { CHAT_INPUT_CLEARANCE } from "@/lib/layout/constants";
import type { Player, Team } from "@/types";

export default function ChatPage({
  params,
}: {
  params: Promise<{ teamId: string }>;
}) {
  const { teamId } = use(params);
  const router = useRouter();
  const { user } = useAuth();
  const identity = useMatchdayStore((s) => s.identity);
  const setIdentity = useMatchdayStore((s) => s.setIdentity);
  const realtime = useRealtime();
  // Prefer the match the user actually joined (identity.matchId) so the squad
  // rail hydrates for that match, not whichever match happens to be featured.
  const identityMatch = identity?.matchId ? getMatch(identity.matchId) : undefined;
  const match = identityMatch ?? getLiveOrUpcomingMatch();
  const team = getTeam(teamId);
  // Identity is source of truth: any two users who joined the same match+team
  // subscribe to the same chat channel regardless of the "featured" match.
  const matchId = identity?.matchId ?? match?.id ?? "match-spain-france";
  const { messages, sendMessage } = useTeamChat(teamId, matchId);
  const [, setSquadTick] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Once identity is loaded from Zustand persist, decide if we should chat here.
  const hasActiveIdentity =
    !!user && !!identity && identity.teamId === teamId;

  useEffect(() => {
    if (!user || !identity) return;
    if (identity.teamId !== teamId) {
      router.replace(`/chat/${identity.teamId}`);
    }
  }, [user, identity, teamId, router]);

  // Self-heal: a pick saved locally before the DB write succeeded leaves a
  // "ghost" membership with no user_identities row, and chat RLS then rejects
  // every message. Reconcile the row whenever we land in a team chat.
  useEffect(() => {
    if (!INSFORGE_ENABLED) return;
    if (!user || !identity) return;
    if (identity.teamId !== teamId) return;

    void upsertUserIdentity(identity).catch((err) => {
      console.error("[identity] could not reconcile squad membership", err);
    });
  }, [user, identity, teamId]);

  // Rehydrate the squad on direct navigation / refresh so the "Live squad"
  // rail always shows the roster instead of just the current user.
  useEffect(() => {
    if (getPlayersByTeam(teamId).length > 0) return;

    let cancelled = false;
    const hasSquadApi =
      matchId.startsWith("af-") || matchId.startsWith("fd-");

    const finishWithFallback = () => {
      if (cancelled) return;
      const currentTeam = getTeam(teamId);
      if (currentTeam && getPlayersByTeam(teamId).length === 0) {
        mergeMatchSquads([], generateFallbackSquad(currentTeam));
        setSquadTick((tick) => tick + 1);
      }
    };

    if (!hasSquadApi) {
      finishWithFallback();
      return () => {
        cancelled = true;
      };
    }

    void fetch(`/api/matches/squads?matchId=${encodeURIComponent(matchId)}`)
      .then(async (response) => {
        if (!response.ok) {
          finishWithFallback();
          return;
        }
        const payload = (await response.json()) as {
          teams?: Team[];
          players?: Player[];
        };
        if (cancelled) return;
        mergeMatchSquads(payload.teams ?? [], payload.players ?? []);
        if (getPlayersByTeam(teamId).length === 0) {
          finishWithFallback();
        } else {
          setSquadTick((tick) => tick + 1);
        }
      })
      .catch(finishWithFallback);

    return () => {
      cancelled = true;
    };
  }, [matchId, teamId]);

  useEffect(() => {
    if (!menuOpen) return;
    const onPointerDown = (event: MouseEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [menuOpen]);

  const handleLeaveMatch = async () => {
    if (!user || !identity || leaving) return;
    setLeaving(true);
    setMenuOpen(false);

    const leavingMatchId = identity.matchId;
    setIdentity(null);
    realtime.clearPresence(user.id);

    if (INSFORGE_ENABLED) {
      try {
        await deleteUserIdentityForMatch(user.id, leavingMatchId);
      } catch {
        // Local leave already applied; DB cleanup can retry on next session.
      }
    }

    try {
      sessionStorage.removeItem(
        `matchday:reminder-dismissed:${leavingMatchId}`,
      );
    } catch {
      // ignore
    }

    setLeaving(false);
    router.replace("/chat");
  };

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
      <header className="relative z-10 flex items-center gap-3 bg-[#0B0F14]/80 px-3 py-3 backdrop-blur-md">
        <Link
          href="/map"
          aria-label="Back"
          className="flex h-9 w-9 items-center justify-center rounded-full text-white transition-colors hover:bg-white/10"
        >
          <ChevronLeft className="h-6 w-6" strokeWidth={2.5} />
        </Link>
        {team && (
          <div className="relative h-10 w-10 shrink-0">
            <Image
              src={team.flagUrl}
              alt={team.name}
              fill
              className="object-contain drop-shadow-[0_1px_6px_rgba(0,0,0,0.55)]"
            />
          </div>
        )}
        <div className="min-w-0 flex-1">
          <h1 className="truncate font-heading text-base font-bold text-white">
            {team?.name ?? "Team"} Squad
          </h1>
          <p className="truncate text-xs text-white/50">
            {matchLabel
              ? `${matchLabel}${match && getDerivedMatchStatus(match) === "live" ? " · LIVE" : ""}`
              : messages.length > 0
                ? `${messages.length} messages`
                : "No chats yet"}
          </p>
        </div>

        {hasActiveIdentity && (
          <div className="relative shrink-0" ref={menuRef}>
            <button
              type="button"
              aria-label="Match options"
              aria-expanded={menuOpen}
              aria-haspopup="menu"
              disabled={leaving}
              onClick={() => setMenuOpen((open) => !open)}
              className="flex h-9 w-9 items-center justify-center rounded-full text-white/70 transition-colors hover:bg-white/10 hover:text-white"
            >
              <MoreHorizontal className="h-5 w-5" strokeWidth={2.25} />
            </button>
            {menuOpen && (
              <div
                role="menu"
                className="absolute right-0 top-11 z-30 min-w-[10rem] overflow-hidden rounded-xl border border-white/10 bg-[#141A22] py-1 shadow-lg"
              >
                <button
                  type="button"
                  role="menuitem"
                  disabled={leaving}
                  onClick={() => void handleLeaveMatch()}
                  className="w-full px-3 py-2.5 text-left text-sm font-medium text-red-400 transition-colors hover:bg-white/5"
                >
                  Leave match
                </button>
              </div>
            )}
          </div>
        )}
      </header>

      <div
        className="relative z-10 flex min-h-0 flex-1 flex-col"
        style={{ paddingBottom: CHAT_INPUT_CLEARANCE }}
      >
        <ChatStoriesRow
          messages={messages}
          teamId={teamId}
          matchId={matchId}
          team={team}
        />
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
