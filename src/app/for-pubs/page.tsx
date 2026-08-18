"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export default function ForPubsPage() {
  const { user, isAuthenticated } = useAuth();
  const [loading, setLoading] = useState(false);
  const [promoLoading, setPromoLoading] = useState(false);
  const [promoCode, setPromoCode] = useState("");
  const [error, setError] = useState<string | null>(null);

  const requireLogin = () => {
    if (!isAuthenticated) {
      window.location.href = "/login?next=/for-pubs";
      return false;
    }
    return true;
  };

  const startCheckout = async () => {
    setError(null);
    if (!requireLogin()) return;
    setLoading(true);
    try {
      const res = await fetch("/api/stripe/checkout", { method: "POST" });
      const data = (await res.json()) as { url?: string; error?: string };
      if (!res.ok || !data.url) {
        throw new Error(data.error || "Could not start checkout");
      }
      window.location.href = data.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Checkout failed");
      setLoading(false);
    }
  };

  const applyPromo = async () => {
    setError(null);
    if (!requireLogin()) return;
    setPromoLoading(true);
    try {
      const res = await fetch("/api/stripe/promo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: promoCode }),
      });
      const data = (await res.json()) as {
        redirectTo?: string;
        error?: string;
      };
      if (!res.ok) throw new Error(data.error || "Invalid coupon");
      window.location.href = data.redirectTo || "/partner";
    } catch (err) {
      setError(err instanceof Error ? err.message : "Promo failed");
      setPromoLoading(false);
    }
  };

  return (
    <div className="min-h-dvh bg-[#0B0F14] text-white">
      <div className="mx-auto flex max-w-lg flex-col gap-8 px-4 py-10">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-[#FFFC00]">
            LocalDerby for Pubs
          </p>
          <h1 className="mt-2 font-heading text-3xl font-bold uppercase tracking-wide">
            $10 / month
          </h1>
          <p className="mt-3 text-sm text-white/60">
            List your San Francisco pub on the LocalDerby map, set the matches
            you screen, configure fan rewards, and validate QR coupons at the
            door. After you subscribe, enter the Terac claim code (LD-XXXXXX)
            on the partner dashboard to unlock your pub.
          </p>
        </div>

        <ul className="space-y-3 text-sm text-white/80">
          <li>• Pub profile on the live fan map</li>
          <li>• Screening match label fans can see</li>
          <li>• Daily coupon cap you control</li>
          <li>• In-app QR validation for rewards</li>
        </ul>

        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <p className="font-heading text-lg font-bold uppercase">
            Pub Host subscription
          </p>
          <p className="mt-1 text-3xl font-bold text-[#FFFC00]">
            $10<span className="text-base text-white/50">/mo</span>
          </p>
          <Button
            className="mt-4 w-full rounded-xl bg-[#FFFC00] text-black hover:bg-[#FFFC00]/90"
            disabled={loading || promoLoading}
            onClick={() => void startCheckout()}
          >
            {loading ? "Redirecting…" : "Subscribe with Stripe"}
          </Button>

          <div className="mt-5 border-t border-white/10 pt-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-white/45">
              Have a coupon?
            </p>
            <div className="mt-2 flex gap-2">
              <Input
                value={promoCode}
                onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                placeholder="Enter code"
                className="rounded-xl border-white/15 bg-black/30 uppercase"
                autoCapitalize="characters"
              />
              <Button
                variant="outline"
                className="shrink-0 rounded-xl"
                disabled={promoLoading || loading || !promoCode.trim()}
                onClick={() => void applyPromo()}
              >
                {promoLoading ? "…" : "Apply"}
              </Button>
            </div>
          </div>

          {error && <p className="mt-3 text-sm text-red-400">{error}</p>}
          {user && (
            <p className="mt-3 text-xs text-white/40">
              Signed in as {user.email || user.name}
            </p>
          )}
        </div>

        <Link
          href="/field"
          className={cn(
            buttonVariants({ variant: "ghost" }),
            "rounded-xl text-center text-white/70",
          )}
        >
          Terac field visit form
        </Link>
      </div>
    </div>
  );
}
