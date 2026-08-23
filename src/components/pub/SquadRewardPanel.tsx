"use client";

import { useState } from "react";
import { ChevronRight, Gift, Sparkles } from "lucide-react";
import { SquadCouponsSheet } from "./SquadCouponsSheet";
import { cn } from "@/lib/utils";

const COUPON_VALUE = 5;
const SEGMENTS = 11;

interface SquadRewardPanelProps {
  presentPlayers: number;
  rosterSize: number;
  presentFans: number;
  pubName?: string;
  pubId?: string;
}

export function SquadRewardPanel({
  presentPlayers,
  rosterSize,
  presentFans,
  pubName,
  pubId,
}: SquadRewardPanelProps) {
  const [couponsOpen, setCouponsOpen] = useState(false);
  const isFullSquad = presentPlayers >= rosterSize && rosterSize > 0;
  const filled = Math.min(presentPlayers, SEGMENTS);
  const next = filled < SEGMENTS ? filled : -1;

  return (
    <>
      <button
        type="button"
        onClick={() => setCouponsOpen(true)}
        aria-expanded={couponsOpen}
        aria-label="View pub reward coupons"
        className={cn(
          "relative w-full overflow-hidden bg-paper px-4 py-3.5 text-left transition-[filter] duration-[var(--duration-press)] ease-out active:brightness-[0.96]",
          "before:absolute before:left-0 before:top-1/2 before:size-[22px] before:-translate-x-1/2 before:-translate-y-1/2 before:rounded-full before:bg-land",
          "after:absolute after:right-0 after:top-1/2 after:size-[22px] after:translate-x-1/2 after:-translate-y-1/2 after:rounded-full after:bg-land",
        )}
      >
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-card border-2 border-ink">
            {isFullSquad ? (
              <Sparkles className="h-5 w-5 text-ink" />
            ) : (
              <Gift className="h-5 w-5 text-ink" />
            )}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-baseline justify-between gap-2">
              <p className="truncate font-display text-chip text-ink">
                {isFullSquad
                  ? `$${COUPON_VALUE} coupon${presentFans === 1 ? "" : "s"} ready`
                  : `$${COUPON_VALUE} coupons at full squad`}
              </p>
              <span className="shrink-0 font-display text-micro text-ink-muted">
                {presentPlayers}/{rosterSize}
              </span>
            </div>

            <div className="mt-2 flex gap-1">
              {Array.from({ length: SEGMENTS }, (_, index) => (
                <span
                  key={index}
                  className={cn(
                    "h-2.5 min-h-[10px] flex-1",
                    index < filled && "bg-ink",
                    index === next && "bg-[image:var(--hatch-next)] bg-ghost-fill",
                    index > filled && index !== next && "bg-ghost-fill",
                  )}
                />
              ))}
            </div>
          </div>

          <ChevronRight
            className="h-4 w-4 shrink-0 text-ink-muted"
            aria-hidden
          />
        </div>
      </button>

      <SquadCouponsSheet
        open={couponsOpen}
        onOpenChange={setCouponsOpen}
        context={{ presentPlayers, rosterSize, presentFans }}
        pubName={pubName}
        pubId={pubId}
      />
    </>
  );
}
