"use client";

import Image from "next/image";
import { ArrowUpRight, X } from "lucide-react";
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
import { NameStack } from "@/components/visual/NameStack";

export function PubSquadSheet() {
  const selectedPub = useMatchdayStore((s) => s.selectedPub);
  const setSelectedPub = useMatchdayStore((s) => s.setSelectedPub);
  const squad = usePubSquad(selectedPub?.id ?? null);

  return (
    <Sheet open={!!selectedPub} onOpenChange={(open) => !open && setSelectedPub(null)}>
      <SheetContent
        side="bottom"
        showCloseButton={false}
        className="h-[calc(100dvh-56px)] max-h-[calc(100dvh-56px)] overflow-y-auto rounded-tl-[22px] border-0 bg-land px-4 pb-8 pt-5 md:mx-auto md:max-w-3xl"
      >
        {selectedPub && (
          <>
            <div
              aria-hidden
              className="pointer-events-none absolute inset-x-0 top-2 mx-auto h-1 w-10 rounded-pill bg-ink-muted-strong"
            />
            <SheetHeader className="gap-3 text-left">
              <div className="flex items-start gap-3">
                <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-card border-[3px] border-ink">
                  <Image
                    src={selectedPub.imageUrl}
                    alt={selectedPub.name}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                </div>
                <SheetTitle className="min-w-0 flex-1">
                  <NameStack name={selectedPub.name} className="text-block" />
                </SheetTitle>
                <SheetClose
                  render={
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      className="h-11 w-11 shrink-0 rounded-full border-2 border-ink bg-paper text-ink hover:bg-paper"
                    />
                  }
                >
                  <X className="h-[18px] w-[18px]" strokeWidth={2.5} />
                  <span className="sr-only">Close</span>
                </SheetClose>
              </div>
              <p className="font-display text-section text-ink">
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
                className="flex min-h-11 w-full items-center gap-3 rounded-card border-2 border-ink bg-paper px-3 text-left transition-[transform] duration-[var(--duration-press)] ease-out active:scale-95"
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-ink">
                  <ArrowUpRight className="h-4 w-4 text-c-lime" strokeWidth={2.5} />
                </span>
                <span className="min-w-0 truncate font-utility text-sm text-ink">
                  {selectedPub.address || selectedPub.neighborhood}
                </span>
              </button>
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
