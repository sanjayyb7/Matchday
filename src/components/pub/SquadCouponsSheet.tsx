"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Check, ChevronRight, Lock, X } from "lucide-react";
import QRCode from "qrcode";
import { NameStack } from "@/components/visual/NameStack";
import {
  getPubCoupons,
  type PubCoupon,
  type SquadCouponContext,
} from "@/lib/rewards/coupons";
import { staggerContainer, staggerItem, uiTransition } from "@/lib/motion/tokens";
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

const TICKET_FILLS = [
  "var(--c-amber)",
  "var(--c-pink)",
  "var(--c-blue)",
  "var(--c-mint)",
] as const;

function SegmentBar({
  filled,
  total,
  next,
}: {
  filled: number;
  total: number;
  next: number;
}) {
  if (total <= 0) return null;
  return (
    <div className="mt-2 flex gap-1">
      {Array.from({ length: total }, (_, index) => (
        <span
          key={index}
          className={cn(
            "h-2.5 min-h-[10px] flex-1",
            index < filled && "bg-ink",
            index === next && "bg-[image:var(--hatch-next)] bg-ink/15",
            index > filled && index !== next && "bg-ink/15",
          )}
        />
      ))}
    </div>
  );
}

function CouponCard({
  coupon,
  reduced,
  pubId,
  claimed,
  onClaimed,
  fillIndex,
}: {
  coupon: PubCoupon;
  reduced: boolean;
  pubId?: string;
  claimed: ClaimedCoupon | null;
  onClaimed: (claim: ClaimedCoupon) => void;
  fillIndex: number;
}) {
  const unlocked = coupon.status === "unlocked";
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isThisClaimed = claimed?.couponId === coupon.id;
  const target = coupon.target ?? 0;
  const current = Math.min(coupon.current ?? 0, target);
  const next = unlocked || target === 0 || current >= target ? -1 : current;
  const canClaim = unlocked && !!pubId && !isThisClaimed;

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

  const fill = unlocked
    ? "var(--c-lime)"
    : TICKET_FILLS[fillIndex % TICKET_FILLS.length];

  return (
    <motion.article
      variants={staggerItem(reduced)}
      className="overflow-hidden rounded-[20px] px-4 py-4 text-left"
      style={{ backgroundColor: fill }}
    >
      <div className="flex items-center gap-3">
        <div
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-card bg-paper text-xl"
          aria-hidden
        >
          {coupon.emoji}
        </div>
        <div className="flex min-w-0 flex-1 items-center justify-between gap-2">
          <div className="min-w-0">
            <p className="font-display text-chip leading-none text-ink">
              {coupon.title}
            </p>
            <p
              className={cn(
                "mt-0.5 font-utility text-xs leading-snug",
                unlocked ? "text-ink/70" : "text-ink-muted",
              )}
            >
              {coupon.description}
            </p>
          </div>
          <span
            className={cn(
              "shrink-0 rounded-pill bg-ink px-2.5 py-1 font-display text-micro",
              unlocked ? "text-c-lime" : "text-paper",
            )}
          >
            {coupon.value}
          </span>
        </div>
      </div>

      <div className="my-3 border-t border-dashed border-ink/25" />

      <div className="flex items-center gap-1.5">
        {unlocked ? (
          <Check className="h-3.5 w-3.5 shrink-0 text-ink" strokeWidth={2.5} />
        ) : (
          <Lock className="h-3.5 w-3.5 shrink-0 text-ink-muted" strokeWidth={2.25} />
        )}
        <p className="min-w-0 flex-1 truncate font-display text-micro text-ink">
          {coupon.requirement}
        </p>
        {target > 0 && (
          <span className="shrink-0 font-display text-micro text-ink-muted">
            {current}/{target}
          </span>
        )}
      </div>

      {target > 1 && (
        <SegmentBar filled={current} total={target} next={next} />
      )}

      {canClaim && (
        <button
          type="button"
          onClick={() => void claim()}
          disabled={loading}
          className="press-pill mt-3 flex min-h-11 w-full items-center justify-center gap-1 rounded-pill bg-ink font-display text-chip text-paper disabled:opacity-60"
        >
          {loading ? "Claiming…" : "Show at the bar"}
          {!loading && <ChevronRight className="h-4 w-4" strokeWidth={2.5} />}
        </button>
      )}

      {isThisClaimed && (
        <div className="mt-3 flex flex-col items-center gap-2 rounded-card bg-paper p-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={claimed.qrDataUrl} alt="Coupon QR" className="rounded-md" />
          <p className="break-all text-center font-utility text-[10px] text-ink-muted">
            {claimed.token}
          </p>
          <p className="text-center font-utility text-[11px] text-ink">
            Show this to the pub to redeem
          </p>
        </div>
      )}

      {error && (
        <p className="mt-2 font-utility text-[11px] text-live" role="alert">
          {error}
        </p>
      )}
    </motion.article>
  );
}

export function PubRewardsList({
  context,
  pubName,
  pubId,
}: {
  context: SquadCouponContext;
  pubName?: string;
  pubId?: string;
}) {
  const reduced = useReducedMotion() ?? false;
  const coupons = getPubCoupons(context);
  const unlockedCount = coupons.filter((c) => c.status === "unlocked").length;
  const [claimed, setClaimed] = useState<ClaimedCoupon | null>(null);

  return (
    <div>
      <p className="font-display text-micro text-ink">
        {pubName ? `${pubName} · ` : ""}
        {unlockedCount} of {coupons.length} unlocked
      </p>
      <div className="mt-3 flex gap-1">
        {coupons.map((coupon) => (
          <span
            key={coupon.id}
            className={cn(
              "h-2 min-h-[8px] flex-1",
              coupon.status === "unlocked" ? "bg-ink" : "bg-ink/20",
            )}
          />
        ))}
      </div>
      <motion.div
        variants={staggerContainer(reduced, 0.04)}
        initial="hidden"
        animate="show"
        className="mt-5 flex flex-col gap-3 pb-1"
      >
        {coupons.map((coupon, index) => (
          <CouponCard
            key={coupon.id}
            coupon={coupon}
            reduced={reduced}
            pubId={pubId}
            claimed={claimed}
            onClaimed={setClaimed}
            fillIndex={index}
          />
        ))}
      </motion.div>
    </div>
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

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.stopPropagation();
      onOpenChange(false);
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [open, onOpenChange]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="pub-rewards"
          role="dialog"
          aria-modal="true"
          aria-labelledby="pub-rewards-title"
          initial={{ x: "100%" }}
          animate={{ x: 0 }}
          exit={{ x: "100%" }}
          transition={uiTransition(reduced, 0.32)}
          className="fixed inset-x-0 bottom-0 z-[60] h-[calc(100dvh-56px)] max-h-[calc(100dvh-56px)] overflow-y-auto rounded-t-[22px] bg-c-amber px-4 pb-[calc(1.5rem+env(safe-area-inset-bottom))] pt-5 md:mx-auto md:max-w-3xl"
          style={{
            backgroundImage: "var(--card-texture)",
            backgroundSize: "var(--card-texture-size)",
          }}
        >
          <header className="relative pr-14 text-left">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="absolute right-0 top-0 flex h-11 w-11 items-center justify-center rounded-full border-2 border-ink bg-paper text-ink"
              aria-label="Back"
            >
              <X className="h-[18px] w-[18px]" strokeWidth={2.5} />
            </button>
            <h2 id="pub-rewards-title">
              <NameStack name="Pub Rewards" className="text-sub" />
            </h2>
          </header>
          <div className="mt-4">
            <PubRewardsList context={context} pubName={pubName} pubId={pubId} />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
