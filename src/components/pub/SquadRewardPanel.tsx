"use client";

import { useState } from "react";
import { ChevronRight, Gift, Sparkles } from "lucide-react";
import { SquadCouponsSheet } from "./SquadCouponsSheet";
import { cn } from "@/lib/utils";

const COUPON_VALUE = 5;

interface SquadRewardPanelProps {
  presentPlayers: number;
  rosterSize: number;
  presentFans: number;
  pubName?: string;
}

export function SquadRewardPanel({
  presentPlayers,
  rosterSize,
  presentFans,
  pubName,
}: SquadRewardPanelProps) {
  const [couponsOpen, setCouponsOpen] = useState(false);
  const isFullSquad = presentPlayers >= rosterSize && rosterSize > 0;
  const progress = rosterSize > 0 ? (presentPlayers / rosterSize) * 100 : 0;

  return (
    <>
      <button
        type="button"
        onClick={() => setCouponsOpen(true)}
        aria-expanded={couponsOpen}
        aria-label="View pub reward coupons"
        className={cn(
          "flex w-full items-center gap-2.5 rounded-xl border px-3 py-2 text-left transition-[transform,border-color,background-color] duration-150 ease-[var(--ease-out-strong)] active:scale-[0.98]",
          isFullSquad
            ? "border-[#FFFC00]/35 bg-[#FFFC00]/10"
            : "border-white/10 bg-white/[0.03]",
        )}
      >
        {isFullSquad ? (
          <Sparkles className="h-3.5 w-3.5 shrink-0 text-[#FFFC00]" />
        ) : (
          <Gift className="h-3.5 w-3.5 shrink-0 text-white/45" />
        )}

        <div className="min-w-0 flex-1">
          <div className="flex items-baseline justify-between gap-2">
            <p
              className={cn(
                "truncate text-[11px] font-semibold leading-tight",
                isFullSquad ? "text-[#FFFC00]" : "text-white/75",
              )}
            >
              {isFullSquad
                ? `$${COUPON_VALUE} coupon${presentFans === 1 ? "" : "s"} for all ${presentFans} fans`
                : `$${COUPON_VALUE} coupons when full squad`}
            </p>
            <span className="shrink-0 text-[10px] font-bold tabular-nums text-white/45">
              {presentPlayers}/{rosterSize}
            </span>
          </div>

          <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-white/10">
            <div
              className={cn(
                "h-full rounded-full transition-[width] duration-500 ease-[var(--ease-out-strong)]",
                isFullSquad ? "bg-[#FFFC00]" : "bg-white/40",
              )}
              style={{ width: `${Math.min(progress, 100)}%` }}
            />
          </div>
        </div>

        <ChevronRight
          className="h-4 w-4 shrink-0 text-white/30"
          aria-hidden
        />
      </button>

      <SquadCouponsSheet
        open={couponsOpen}
        onOpenChange={setCouponsOpen}
        context={{ presentPlayers, rosterSize, presentFans }}
        pubName={pubName}
      />
    </>
  );
}
