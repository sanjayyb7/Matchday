"use client";

import Image from "next/image";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useMatchdayStore } from "@/store/matchday-store";
import { getTeam } from "@/lib/mock/data";
import { Badge } from "@/components/ui/badge";

export function PlayerProfileModal() {
  const player = useMatchdayStore((s) => s.selectedPlayerProfile);
  const setSelectedPlayerProfile = useMatchdayStore(
    (s) => s.setSelectedPlayerProfile,
  );
  const team = player ? getTeam(player.teamId) : null;

  return (
    <Dialog
      open={!!player}
      onOpenChange={(open) => !open && setSelectedPlayerProfile(null)}
    >
      <DialogContent className="max-w-sm border-white/10 bg-card">
        {player && (
          <>
            <DialogHeader>
              <DialogTitle className="font-heading text-2xl uppercase">
                {player.name}
              </DialogTitle>
            </DialogHeader>
            <div className="flex flex-col items-center gap-4">
              <div
                className="relative h-32 w-32 overflow-hidden rounded-2xl ring-2 ring-white/20"
                style={{ boxShadow: team ? `0 0 24px ${team.color}44` : undefined }}
              >
                <Image
                  src={player.imageUrl}
                  alt={player.name}
                  fill
                  className="object-cover"
                  unoptimized
                />
                <span className="absolute bottom-2 right-2 text-3xl font-black text-white/40">
                  {player.number}
                </span>
              </div>
              <div className="flex flex-wrap justify-center gap-2">
                <Badge variant="secondary">{player.position}</Badge>
                <Badge variant="secondary">{player.country}</Badge>
                <Badge variant="secondary">Age {player.age}</Badge>
              </div>
              <p className="text-sm text-muted-foreground">{player.club}</p>
              <div className="grid w-full grid-cols-3 gap-3 rounded-2xl bg-muted/50 p-4">
                <Stat label="Goals" value={player.stats.goals} />
                <Stat label="Assists" value={player.stats.assists} />
                <Stat label="Caps" value={player.stats.caps} />
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="text-center">
      <p className="font-heading text-2xl font-bold text-primary">{value}</p>
      <p className="text-[10px] uppercase text-muted-foreground">{label}</p>
    </div>
  );
}
