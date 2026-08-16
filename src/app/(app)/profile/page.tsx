"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { MoreHorizontal } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useMatchdayStore } from "@/store/matchday-store";
import { useHistory } from "@/hooks/useHistory";
import {
  getLiveOrUpcomingMatch,
  getPlayer,
  getPub,
  getTeam,
  identityMatchesActiveMatch,
  refreshActiveMatchFromApi,
} from "@/lib/mock/data";
import { BOTTOM_NAV_CLEARANCE } from "@/lib/layout/constants";
import { FanHistoryTimeline } from "@/components/profile/FanHistoryTimeline";
import { DeleteAccountDialog } from "@/components/profile/DeleteAccountDialog";
import { Button, buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { findNearestPubId } from "@/lib/geo/haversine";
import { pubs } from "@/lib/mock/data";
import { NEAR_PUB_RADIUS_METERS } from "@/lib/mock/constants";
import { useGeolocation } from "@/hooks/useGeolocation";
import { useRealtime } from "@/lib/realtime/context";
import { INSFORGE_ENABLED } from "@/lib/insforge/config";
import { deleteUserIdentityForMatch } from "@/lib/identity/insforge-identity";
import { cn } from "@/lib/utils";

export default function ProfilePage() {
  const { user, isAdmin, signOut, deleteAccount } = useAuth();
  const router = useRouter();
  const identity = useMatchdayStore((s) => s.identity);
  const setIdentity = useMatchdayStore((s) => s.setIdentity);
  const realtime = useRealtime();
  const [showDelete, setShowDelete] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [, setMatchTick] = useState(0);
  const menuRef = useRef<HTMLDivElement>(null);
  const { position } = useGeolocation();

  useEffect(() => {
    void refreshActiveMatchFromApi().then(() => setMatchTick((value) => value + 1));
  }, []);

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

  const { history } = useHistory(user?.id);
  const liveMatch = getLiveOrUpcomingMatch();
  const activeIdentity =
    identity && identityMatchesActiveMatch(identity, user?.id, liveMatch)
      ? identity
      : null;
  const player = activeIdentity ? getPlayer(activeIdentity.playerId) : null;
  const team = activeIdentity ? getTeam(activeIdentity.teamId) : null;
  const nearbyPubId = findNearestPubId(
    position.lat,
    position.lng,
    pubs,
    NEAR_PUB_RADIUS_METERS,
  );
  const nearbyPub = nearbyPubId ? getPub(nearbyPubId) : null;

  const handleLogout = async () => {
    await signOut();
    router.replace("/login");
  };

  const handleDelete = async () => {
    await deleteAccount();
    setShowDelete(false);
    router.replace("/login");
  };

  const handleLeaveMatch = async () => {
    if (!user || !activeIdentity || leaving) return;
    setLeaving(true);
    setMenuOpen(false);

    const matchId = activeIdentity.matchId;
    setIdentity(null);
    realtime.clearPresence(user.id);

    if (INSFORGE_ENABLED) {
      try {
        await deleteUserIdentityForMatch(user.id, matchId);
      } catch {
        // Local leave already applied; DB cleanup can retry on next session.
      }
    }

    // Allow rejoining via chat / reminder without a stuck dismiss flag.
    try {
      sessionStorage.removeItem(`matchday:reminder-dismissed:${matchId}`);
    } catch {
      // ignore
    }

    setLeaving(false);
    router.replace("/chat");
  };

  return (
    <div className="px-4 py-6" style={{ paddingBottom: BOTTOM_NAV_CLEARANCE }}>
      <header className="mb-8 flex items-center gap-4">
        <div className="relative h-16 w-16 overflow-hidden rounded-2xl ring-2 ring-primary/40">
          <Image
            src={user?.avatarUrl ?? ""}
            alt={user?.name ?? "Fan"}
            fill
            className="object-cover"
            unoptimized
          />
        </div>
        <div>
          <h1 className="font-heading text-2xl font-bold uppercase tracking-wide">
            {user?.name}
          </h1>
          <p className="text-sm text-muted-foreground">
            Fan since{" "}
            {user?.fanSince
              ? new Date(user.fanSince).toLocaleDateString()
              : "today"}
          </p>
        </div>
      </header>

      {activeIdentity && liveMatch && player && team && (
        <section className="mb-8 rounded-2xl border border-primary/30 bg-primary/5 p-4">
          <div className="mb-3 flex items-start justify-between gap-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-primary">
              Current matchday identity
            </p>
            <div className="relative" ref={menuRef}>
              <button
                type="button"
                aria-label="Match options"
                aria-expanded={menuOpen}
                aria-haspopup="menu"
                disabled={leaving}
                onClick={() => setMenuOpen((open) => !open)}
                className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-white/10 hover:text-foreground"
              >
                <MoreHorizontal className="h-5 w-5" />
              </button>
              {menuOpen && (
                <div
                  role="menu"
                  className="absolute right-0 top-9 z-20 min-w-[9.5rem] overflow-hidden rounded-xl border border-white/10 bg-[#141A22] py-1 shadow-lg"
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
          </div>
          <div className="flex items-center gap-4">
            <div className="relative h-14 w-14 overflow-hidden rounded-xl">
              <Image
                src={player.imageUrl}
                alt={player.name}
                fill
                className="object-cover"
                unoptimized
              />
            </div>
            <div className="flex-1">
              <p className="font-semibold">{player.name}</p>
              <div className="mt-1 flex items-center gap-2">
                <Badge variant="secondary">{team.name}</Badge>
                <Badge variant="secondary">#{player.number}</Badge>
              </div>
              {nearbyPub && (
                <p className="mt-2 text-xs text-muted-foreground">
                  Near {nearbyPub.name}
                </p>
              )}
            </div>
          </div>
        </section>
      )}

      <section className="mb-8">
        <h2 className="mb-4 font-heading text-lg font-bold uppercase tracking-wide">
          Match history
        </h2>
        <FanHistoryTimeline history={history} />
      </section>

      <div className="flex flex-col gap-3">
        {isAdmin && (
          <Link
            href="/matchday-matcha"
            className={cn(
              buttonVariants({ variant: "secondary", size: "lg" }),
              "w-full rounded-xl",
            )}
          >
            Manage pub locations
          </Link>
        )}
        {isAdmin && (
          <Link
            href="/admin/field-visits"
            className={cn(
              buttonVariants({ variant: "secondary", size: "lg" }),
              "w-full rounded-xl",
            )}
          >
            Field visit verification
          </Link>
        )}
        <Link
          href="/for-pubs"
          className={cn(
            buttonVariants({ variant: "outline", size: "lg" }),
            "w-full rounded-xl",
          )}
        >
          LocalDerby for Pubs ($10/mo)
        </Link>
        <Link
          href="/partner"
          className={cn(
            buttonVariants({ variant: "outline", size: "lg" }),
            "w-full rounded-xl",
          )}
        >
          Partner dashboard
        </Link>
        <Button
          variant="outline"
          className="w-full rounded-xl"
          onClick={handleLogout}
        >
          Log out
        </Button>
        <Button
          variant="destructive"
          className="w-full rounded-xl"
          onClick={() => setShowDelete(true)}
        >
          Delete account
        </Button>
      </div>

      <DeleteAccountDialog
        open={showDelete}
        onOpenChange={setShowDelete}
        onConfirm={handleDelete}
      />
    </div>
  );
}
