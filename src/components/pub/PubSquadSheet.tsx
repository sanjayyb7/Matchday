"use client";

import Image from "next/image";
import { MapPin } from "lucide-react";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useMatchdayStore } from "@/store/matchday-store";
import { usePubSquad } from "@/hooks/usePubSquad";
import { PubSquadPitch } from "./PubSquadPitch";
import { googleMapsDirectionsUrl } from "@/lib/geo/google-maps-url";

export function PubSquadSheet() {
  const selectedPub = useMatchdayStore((s) => s.selectedPub);
  const setSelectedPub = useMatchdayStore((s) => s.setSelectedPub);
  const squad = usePubSquad(selectedPub?.id ?? null);

  const openMaps = () => {
    if (!selectedPub) return;
    window.open(
      googleMapsDirectionsUrl(selectedPub),
      "_blank",
      "noopener,noreferrer",
    );
  };

  return (
    <Sheet open={!!selectedPub} onOpenChange={(open) => !open && setSelectedPub(null)}>
      <SheetContent
        side="bottom"
        showCloseButton={false}
        className="h-[calc(100dvh-56px)] max-h-[calc(100dvh-56px)] overflow-y-auto rounded-t-[22px] border-0 bg-land px-0 pb-8 pt-5 md:mx-auto md:max-w-3xl"
      >
        {selectedPub && (
          <>
            <SheetClose
              render={
                <button
                  type="button"
                  className="absolute left-1/2 top-0 z-10 flex h-11 w-24 -translate-x-1/2 items-center justify-center"
                />
              }
            >
              <span className="h-1 w-10 rounded-pill bg-ink-muted-strong" />
              <span className="sr-only">Close</span>
            </SheetClose>
            <SheetHeader className="gap-0 p-0 pt-3 text-left">
              <div className="flex items-stretch gap-3 px-[var(--gut)]">
                <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-card border-[3px] border-ink">
                  <Image
                    src={selectedPub.imageUrl}
                    alt=""
                    fill
                    className="object-cover"
                    unoptimized
                  />
                </div>
                <div className="flex min-w-0 flex-1 flex-col justify-start gap-0.5">
                  <SheetTitle className="min-w-0 text-left font-display text-name leading-none text-ink">
                    {selectedPub.name}
                  </SheetTitle>
                  <p className="font-utility text-micro font-medium text-ink-muted">
                    Live squad · {squad.length}{" "}
                    {squad.length === 1 ? "fan" : "fans"}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={openMaps}
                  className="-mr-1.5 flex h-11 w-11 shrink-0 items-start justify-center self-start"
                  aria-label={`Open ${selectedPub.name} in Maps`}
                >
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-ink">
                    <MapPin className="h-4 w-4 text-c-lime" strokeWidth={2.5} />
                  </span>
                </button>
              </div>
            </SheetHeader>
            <div className="mt-4 px-[var(--gut)]">
              <PubSquadPitch
                squad={squad}
                pubName={selectedPub.name}
                pubId={selectedPub.id}
              />
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
