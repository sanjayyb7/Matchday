"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Lock, Sparkles } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  getPubCoupons,
  type PubCoupon,
  type SquadCouponContext,
} from "@/lib/rewards/coupons";
import { staggerContainer, staggerItem } from "@/lib/motion/tokens";
import { cn } from "@/lib/utils";

interface SquadCouponsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  context: SquadCouponContext;
  pubName?: string;
}

function CouponCard({
  coupon,
  reduced,
}: {
  coupon: PubCoupon;
  reduced: boolean;
}) {
  const unlocked = coupon.status === "unlocked";

  return (
    <motion.div
      variants={staggerItem(reduced)}
      className={cn(
        "flex gap-3 rounded-xl border p-3 transition-[border-color,background-color] duration-200 ease-[var(--ease-out-strong)]",
        unlocked
          ? "border-[#FFFC00]/40 bg-[#FFFC00]/8"
          : "border-white/10 bg-white/[0.03]",
      )}
    >
      <div
        className={cn(
          "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-xl",
          unlocked ? "bg-[#FFFC00]/15" : "bg-white/5",
        )}
        aria-hidden
      >
        {coupon.emoji}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p
              className={cn(
                "text-sm font-semibold leading-tight",
                unlocked ? "text-[#FFFC00]" : "text-white/90",
              )}
            >
              {coupon.title}
            </p>
            <p className="mt-0.5 text-[11px] leading-snug text-white/50">
              {coupon.description}
            </p>
          </div>
          <span
            className={cn(
              "shrink-0 rounded-lg px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide",
              unlocked
                ? "bg-[#FFFC00]/20 text-[#FFFC00]"
                : "bg-white/10 text-white/45",
            )}
          >
            {coupon.value}
          </span>
        </div>

        <div className="mt-2 flex items-center gap-1.5">
          {unlocked ? (
            <Sparkles className="h-3 w-3 shrink-0 text-[#FFFC00]" />
          ) : (
            <Lock className="h-3 w-3 shrink-0 text-white/35" />
          )}
          <p className="truncate text-[10px] text-white/40">
            {coupon.requirement}
          </p>
        </div>

        {coupon.status === "progress" && coupon.progress !== undefined && (
          <div className="mt-2 h-1 overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-white/45 transition-[width] duration-500 ease-[var(--ease-out-strong)]"
              style={{ width: `${coupon.progress}%` }}
            />
          </div>
        )}
      </div>
    </motion.div>
  );
}

export function SquadCouponsSheet({
  open,
  onOpenChange,
  context,
  pubName,
}: SquadCouponsSheetProps) {
  const reduced = useReducedMotion() ?? false;
  const coupons = getPubCoupons(context);
  const unlockedCount = coupons.filter((c) => c.status === "unlocked").length;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        elevated
        className="max-h-[min(72vh,520px)] rounded-t-3xl border-white/10 bg-[#0B0F14] px-4 pb-[calc(1.5rem+env(safe-area-inset-bottom))] pt-2"
      >
        <SheetHeader className="border-b border-white/10 pb-3 text-left">
          <SheetTitle className="font-heading text-lg uppercase text-white">
            Pub rewards
          </SheetTitle>
          <SheetDescription className="text-white/55">
            {pubName ? `${pubName} · ` : ""}
            {unlockedCount} of {coupons.length} unlocked
          </SheetDescription>
        </SheetHeader>

        <motion.div
          key={open ? "open" : "closed"}
          variants={staggerContainer(reduced, 0.04)}
          initial="hidden"
          animate="show"
          className="mt-3 flex max-h-[calc(min(72vh,520px)-7rem)] flex-col gap-2 overflow-y-auto overscroll-contain pb-1"
        >
          {coupons.map((coupon) => (
            <CouponCard key={coupon.id} coupon={coupon} reduced={reduced} />
          ))}
        </motion.div>
      </SheetContent>
    </Sheet>
  );
}
