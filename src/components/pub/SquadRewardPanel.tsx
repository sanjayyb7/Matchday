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
  const progress = rosterSize > 0 ? (presentPlayers / rosterSize) * 100 : 0;

  return (
    <>
      <button
        type="button"
        onClick={() => setCouponsOpen(true)}
        aria-expanded={couponsOpen}
        aria-label="View pub reward coupons"
        className={cn(
          "flex w-full items-center gap-3 rounded-2xl border px-4 py-3.5 text-left transition-[transform,border-color,background-color] duration-150 ease-[var(--ease-out-strong)] active:scale-[0.98]",
          isFullSquad
            ? "border-[#FFFC00]/40 bg-[#FFFC00]/10"
            : "border-white/10 bg-white/[0.04]",
        )}
      >
        <div
          className={cn(
            "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl",
            isFullSquad ? "bg-[#FFFC00]/20" : "bg-white/[0.06]",
          )}
        >
          {isFullSquad ? (
            <Sparkles className="h-5 w-5 text-[#FFFC00]" />
          ) : (
            <Gift className="h-5 w-5 text-white/60" />
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-baseline justify-between gap-2">
            <p
              className={cn(
                "truncate text-sm font-semibold leading-tight",
                isFullSquad ? "text-[#FFFC00]" : "text-white",
              )}
            >
              {isFullSquad
                ? `$${COUPON_VALUE} coupon${presentFans === 1 ? "" : "s"} ready`
                : `$${COUPON_VALUE} coupons at full squad`}
            </p>
            <span className="shrink-0 text-xs font-bold tabular-nums text-white/60">
              {presentPlayers}/{rosterSize}
            </span>
          </div>

          <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-[#FFFC00] transition-[width] duration-500 ease-[var(--ease-out-strong)]"
              style={{ width: `${Math.min(progress, 100)}%` }}
            />
          </div>
        </div>

        <ChevronRight
          className="h-4 w-4 shrink-0 text-white/40"
          aria-hidden
        />
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
