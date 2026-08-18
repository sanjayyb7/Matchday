"use client";

import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Lock, Sparkles } from "lucide-react";
import QRCode from "qrcode";
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
  pubId?: string;
}

interface ClaimedCoupon {
  couponId: string;
  qrDataUrl: string;
  token: string;
}

function CouponCard({
  coupon,
  reduced,
  pubId,
  claimed,
  onClaimed,
}: {
  coupon: PubCoupon;
  reduced: boolean;
  pubId?: string;
  claimed: ClaimedCoupon | null;
  onClaimed: (claim: ClaimedCoupon) => void;
}) {
  const unlocked = coupon.status === "unlocked";
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isThisClaimed = claimed?.couponId === coupon.id;

  const claim = async () => {
    if (!pubId || loading) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/coupons/claim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pubId, couponId: coupon.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Claim failed");
      const token = String(data.qrPayload || data.claim?.token || "");
      const qrDataUrl = await QRCode.toDataURL(token, {
        margin: 1,
        width: 220,
        color: { dark: "#000000", light: "#ffffff" },
      });
      onClaimed({ couponId: coupon.id, qrDataUrl, token });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Claim failed");
    } finally {
      setLoading(false);
    }
  };

  const Wrapper = unlocked && pubId && !isThisClaimed ? motion.button : motion.div;
  const wrapperProps =
    unlocked && pubId && !isThisClaimed
      ? { type: "button" as const, onClick: () => void claim(), disabled: loading }
      : {};

  return (
    <Wrapper
      variants={staggerItem(reduced)}
      {...wrapperProps}
      className={cn(
        "flex w-full flex-col gap-3 rounded-xl border p-3 text-left transition-[border-color,background-color] duration-200 ease-[var(--ease-out-strong)]",
        unlocked
          ? "border-[#FFFC00]/40 bg-[#FFFC00]/8"
          : "border-white/10 bg-white/[0.03]",
        unlocked && pubId && !isThisClaimed && "active:scale-[0.99]",
      )}
    >
      <div className="flex gap-3">
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
              {unlocked && pubId && !isThisClaimed
                ? loading
                  ? "Claiming…"
                  : "Tap to claim QR"
                : coupon.requirement}
            </p>
          </div>

          {coupon.status === "progress" && coupon.progress !== undefined && (
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-white/50 transition-[width] duration-500 ease-[var(--ease-out-strong)]"
                style={{ width: `${coupon.progress}%` }}
              />
            </div>
          )}
        </div>
      </div>

      {isThisClaimed && (
        <div className="flex flex-col items-center gap-2 rounded-lg bg-white p-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={claimed.qrDataUrl} alt="Coupon QR" className="rounded-md" />
          <p className="break-all text-center text-[10px] text-black/60">
            {claimed.token}
          </p>
          <p className="text-center text-[11px] text-black/70">
            Show this to the pub to redeem
          </p>
        </div>
      )}

      {error && (
        <p className="text-[11px] text-red-400" role="alert">
          {error}
        </p>
      )}
    </Wrapper>
  );
}

export function SquadCouponsSheet({
  open,
  onOpenChange,
  context,
  pubName,
  pubId,
}: SquadCouponsSheetProps) {
  const reduced = useReducedMotion() ?? false;
  const coupons = getPubCoupons(context);
  const unlockedCount = coupons.filter((c) => c.status === "unlocked").length;
  const [claimed, setClaimed] = useState<ClaimedCoupon | null>(null);

  useEffect(() => {
    if (!open) setClaimed(null);
  }, [open, pubId]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        elevated
        overlayClassName="bg-black/75 [-webkit-backdrop-filter:blur(16px)] backdrop-blur-lg"
        className="max-h-[min(78vh,600px)] rounded-t-3xl border-white/10 bg-[#0B0F14] px-4 pb-[calc(1.5rem+env(safe-area-inset-bottom))] pt-2"
      >
        <SheetHeader className="border-b border-white/10 pb-3 text-left">
          <SheetTitle className="font-heading text-lg uppercase text-white">
            Pub rewards
          </SheetTitle>
          <SheetDescription className="text-white/55">
            {pubName ? `${pubName} · ` : ""}
            {unlockedCount} of {coupons.length} unlocked
            {unlockedCount > 0 ? " · tap to claim" : ""}
          </SheetDescription>
        </SheetHeader>

        <motion.div
          key={open ? "open" : "closed"}
          variants={staggerContainer(reduced, 0.04)}
          initial="hidden"
          animate="show"
          className="mt-3 flex max-h-[calc(min(78vh,600px)-7rem)] flex-col gap-2 overflow-y-auto overscroll-contain pb-1"
        >
          {coupons.map((coupon) => (
            <CouponCard
              key={coupon.id}
              coupon={coupon}
              reduced={reduced}
              pubId={pubId}
              claimed={claimed}
              onClaimed={setClaimed}
            />
          ))}
        </motion.div>
      </SheetContent>
    </Sheet>
  );
}
