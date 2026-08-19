"use client";

import Image from "next/image";
import { ArrowUpRight, MapPin, X } from "lucide-react";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
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
        showCloseButton={false}
        className="max-h-[90vh] overflow-y-auto rounded-t-3xl border-white/10 bg-[#0B0F14] px-4 pb-8 pt-5 md:mx-auto md:max-w-3xl"
      >
        {selectedPub && (
          <>
            {/* Drag handle so the top of the sheet reads as a sheet, not
                as content colliding with the close button. */}
            <div
              aria-hidden
              className="pointer-events-none absolute inset-x-0 top-2 mx-auto h-1 w-10 rounded-full bg-white/20"
            />
            <SheetHeader className="gap-2 text-left">
              <div className="flex items-center gap-3">
                <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-xl ring-2 ring-primary/30">
                  <Image
                    src={selectedPub.imageUrl}
                    alt={selectedPub.name}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                </div>
                <SheetTitle className="min-w-0 flex-1 truncate font-heading text-xl uppercase text-white">
                  {selectedPub.name}
                </SheetTitle>
                <SheetClose
                  render={
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      className="h-9 w-9 shrink-0 rounded-full bg-white/10 text-white ring-1 ring-white/20 hover:bg-white/20 hover:text-white"
                    />
                  }
                >
                  <X className="h-[18px] w-[18px]" strokeWidth={2.5} />
                  <span className="sr-only">Close</span>
                </SheetClose>
              </div>
              <div className="flex items-center justify-between gap-3">
                <p className="min-w-0 flex-1 truncate text-xs text-white/45">
                  Live squad · {squad.length}{" "}
                  {squad.length === 1 ? "fan" : "fans"}
                </p>
                <button
                  type="button"
                  onClick={() =>
                    window.open(
                      googleMapsDirectionsUrl(selectedPub),
                      "_blank",
                      "noopener,noreferrer",
                    )
                  }
                  aria-label={`Open ${selectedPub.address || selectedPub.name} in Maps`}
                  className="group inline-flex max-w-[65%] shrink-0 items-center gap-1.5 rounded-full bg-white/[0.06] px-3 py-1.5 text-xs font-medium text-white/80 ring-1 ring-white/10 transition-[background-color,transform] duration-150 ease-[var(--ease-out-strong)] hover:bg-white/10 hover:text-white active:scale-[0.97]"
                >
                  <MapPin
                    className="h-3.5 w-3.5 shrink-0 text-white/70"
                    strokeWidth={2}
                  />
                  <span className="min-w-0 truncate">
                    {selectedPub.address || selectedPub.neighborhood}
                  </span>
                  <ArrowUpRight
                    className="h-3.5 w-3.5 shrink-0 text-white/60 transition-transform duration-150 group-hover:translate-x-[1px] group-hover:-translate-y-[1px]"
                    strokeWidth={2}
                  />
                </button>
              </div>
            </SheetHeader>
            <div className="mt-4">
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
