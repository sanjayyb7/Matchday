"use client";

import Image from "next/image";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { useMatchdayStore } from "@/store/matchday-store";
import { usePubSquad } from "@/hooks/usePubSquad";
import { PubSquadPitch } from "./PubSquadPitch";

export function PubSquadSheet() {
  const selectedPub = useMatchdayStore((s) => s.selectedPub);
  const setSelectedPub = useMatchdayStore((s) => s.setSelectedPub);
  const squad = usePubSquad(selectedPub?.id ?? null);

  return (
    <Sheet open={!!selectedPub} onOpenChange={(open) => !open && setSelectedPub(null)}>
      <SheetContent
        side="bottom"
        className="max-h-[90vh] rounded-t-3xl border-white/10 bg-[#0B0F14] px-4 pb-8"
      >
        {selectedPub && (
          <>
            <SheetHeader className="text-left">
              <div className="flex items-center gap-4">
                <div className="relative h-14 w-14 overflow-hidden rounded-2xl ring-2 ring-primary/30">
                  <Image
                    src={selectedPub.imageUrl}
                    alt={selectedPub.name}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                </div>
                <div>
                  <SheetTitle className="font-heading text-xl uppercase text-white">
                    {selectedPub.name}
                  </SheetTitle>
                  <SheetDescription className="text-white/60">
                    {selectedPub.neighborhood} · Live squad · {squad.length} fans
                  </SheetDescription>
                </div>
              </div>
            </SheetHeader>
            <div className="mt-4">
              <PubSquadPitch squad={squad} />
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
