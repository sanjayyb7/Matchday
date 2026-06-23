"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
import { ThemeSelector } from "@/components/profile/ThemeSelector";
import { Button, buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { findNearestPubId } from "@/lib/geo/haversine";
import { pubs } from "@/lib/mock/data";
import { NEAR_PUB_RADIUS_METERS } from "@/lib/mock/constants";
import { useGeolocation } from "@/hooks/useGeolocation";
import { cn } from "@/lib/utils";

export default function ProfilePage() {
  const { user, isAdmin, signOut, deleteAccount } = useAuth();
  const router = useRouter();
  const identity = useMatchdayStore((s) => s.identity);
  const [showDelete, setShowDelete] = useState(false);
  const [, setMatchTick] = useState(0);
  const { position } = useGeolocation();

  useEffect(() => {
    void refreshActiveMatchFromApi().then(() => setMatchTick((value) => value + 1));
  }, []);

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
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-primary">
            Current matchday identity
          </p>
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

      <ThemeSelector />

      <section className="mb-8">
        <h2 className="mb-4 font-heading text-lg font-bold uppercase tracking-wide">
          Matchday history
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
