"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { Button } from "@/components/ui/button";

export function ClaimCouponButton({ pubId }: { pubId: string }) {
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const claim = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/coupons/claim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pubId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Claim failed");
      const payload = String(data.qrPayload || data.claim?.token || "");
      setToken(payload);
      const url = await QRCode.toDataURL(payload, {
        margin: 1,
        width: 220,
        color: { dark: "#000000", light: "#ffffff" },
      });
      setQrDataUrl(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Claim failed");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setQrDataUrl(null);
    setToken(null);
  }, [pubId]);

  return (
    <div className="mt-3 rounded-xl border border-white/10 bg-white/[0.03] p-3">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-white/50">
        Fan coupon
      </p>
      {!qrDataUrl ? (
        <Button
          size="sm"
          className="mt-2 w-full rounded-lg"
          disabled={loading}
          onClick={() => void claim()}
        >
          {loading ? "Claiming…" : "Claim QR coupon"}
        </Button>
      ) : (
        <div className="mt-2 flex flex-col items-center gap-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={qrDataUrl} alt="Coupon QR" className="rounded-lg" />
          <p className="break-all text-center text-[10px] text-white/45">{token}</p>
          <p className="text-center text-[11px] text-white/55">
            Show this to the pub to redeem
          </p>
        </div>
      )}
      {error && <p className="mt-2 text-xs text-red-400">{error}</p>}
    </div>
  );
}
