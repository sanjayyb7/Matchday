"use client";

import Image from "next/image";
import { Navigation } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { useMatchdayStore } from "@/store/matchday-store";
import { usePubSquad } from "@/hooks/usePubSquad";
import { PubSquadPitch } from "./PubSquadPitch";
import { googleMapsDirectionsUrl } from "@/lib/geo/google-maps-url";

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
              <div className="flex items-start justify-between gap-3 pr-8">
                <div className="flex min-w-0 items-center gap-4">
                  <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-2xl ring-2 ring-primary/30">
                    <Image
                      src={selectedPub.imageUrl}
                      alt={selectedPub.name}
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  </div>
                  <div className="min-w-0">
                    <SheetTitle className="font-heading text-xl uppercase text-white">
                      {selectedPub.name}
                    </SheetTitle>
                    <SheetDescription className="text-white/60">
                      {selectedPub.neighborhood} · Live squad · {squad.length} fans
                    </SheetDescription>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="shrink-0 rounded-lg border-white/15 bg-white/5 text-white hover:bg-white/10 hover:text-white"
                  onClick={() =>
                    window.open(
                      googleMapsDirectionsUrl(selectedPub),
                      "_blank",
                      "noopener,noreferrer",
                    )
                  }
                >
                  <Navigation />
                  Open in Maps
                </Button>
              </div>
            </SheetHeader>
            <div className="mt-4">
              <PubSquadPitch squad={squad} pubName={selectedPub.name} />
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
