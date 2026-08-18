"use client";

import { useState } from "react";
import Link from "next/link";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export default function FieldVisitPage() {
  const [form, setForm] = useState({
    workerName: "",
    workerEmail: "",
    pubName: "",
    address: "",
    neighborhood: "",
    contactName: "",
    contactPhone: "",
    contactEmail: "",
    outcome: "interested" as "interested" | "not_interested" | "follow_up",
    notes: "",
    photoUrl: "",
  });
  const [claimCode, setClaimCode] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const submit = async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    setClaimCode(null);
    setCopied(false);
    try {
      const res = await fetch("/api/field-visits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Submit failed");
      const code = String(data.visit?.claimCode || "");
      setClaimCode(code || null);
      setResult(
        `Submitted for review (${data.visit?.status}). Give the claim code to the pub owner.`,
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Submit failed");
    } finally {
      setLoading(false);
    }
  };

  const copyCode = async () => {
    if (!claimCode) return;
    try {
      await navigator.clipboard.writeText(claimCode);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="min-h-dvh bg-[#0B0F14] text-white">
      <div className="mx-auto flex max-w-lg flex-col gap-6 px-4 py-8">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-[#FFFC00]">
            Terac job · $25 each · $50 max
          </p>
          <h1 className="font-heading text-2xl font-bold uppercase">
            Call 2 SF pubs
          </h1>
          <div className="mt-3 space-y-2 rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-sm text-white/70">
            <p>
              <span className="text-white">Job:</span> Call a San Francisco
              soccer/sports pub, get owner/manager details, fill this form.
              Complete for <span className="text-[#FFFC00]">2 different pubs</span>{" "}
              ($25 per form, <span className="text-[#FFFC00]">$50 max</span>).
            </p>
            <ol className="list-decimal space-y-1 pl-4 text-white/60">
              <li>Call the pub — speak to owner/manager about LocalDerby.</li>
              <li>
                Collect name, address, contact, interested?, matches, rewards,
                coupon cap.
              </li>
              <li>Submit this form (one pub = one $25 job).</li>
              <li>
                If interested: give them the claim code →{" "}
                <Link href="/for-pubs" className="text-[#FFFC00] underline">
                  /for-pubs
                </Link>{" "}
                →{" "}
                <Link href="/partner" className="text-[#FFFC00] underline">
                  /partner
                </Link>
                .
              </li>
              <li>Repeat for a second SF pub.</li>
            </ol>
          </div>
        </div>

        {claimCode && (
          <div className="rounded-2xl border border-[#FFFC00]/40 bg-[#FFFC00]/10 p-5 text-center">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-[#FFFC00]">
              Give this code to the pub owner
            </p>
            <p className="mt-2 font-heading text-3xl font-bold tracking-[0.2em] text-white">
              {claimCode}
            </p>
            <Button
              type="button"
              variant="outline"
              className="mt-3 rounded-xl"
              onClick={() => void copyCode()}
            >
              {copied ? "Copied" : "Copy code"}
            </Button>
            <p className="mt-3 text-xs text-white/55">
              Owner: create account → subscribe (or J007) → enter this code on
              /partner.
            </p>
          </div>
        )}

        <div className="space-y-3 rounded-2xl border border-white/10 p-4">
          {(
            [
              ["workerName", "Your name"],
              ["workerEmail", "Your email"],
              ["pubName", "Pub name"],
              ["address", "Address"],
              ["neighborhood", "Neighborhood"],
              ["contactName", "Contact spoken to"],
              ["contactPhone", "Contact phone"],
              ["contactEmail", "Contact email"],
              ["photoUrl", "Optional photo URL"],
            ] as const
          ).map(([key, label]) => (
            <div key={key}>
              <label className="text-[11px] uppercase tracking-wide text-white/40">
                {label}
              </label>
              <Input
                value={form[key]}
                onChange={(e) =>
                  setForm((f) => ({ ...f, [key]: e.target.value }))
                }
                className="mt-1 bg-white/5 text-white"
              />
            </div>
          ))}

          <div>
            <label className="text-[11px] uppercase tracking-wide text-white/40">
              Outcome
            </label>
            <select
              className="mt-1 w-full rounded-md border border-white/10 bg-[#141a22] px-3 py-2 text-sm"
              value={form.outcome}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  outcome: e.target.value as typeof form.outcome,
                }))
              }
            >
              <option value="interested">Interested — set up account</option>
              <option value="follow_up">Follow up later</option>
              <option value="not_interested">Not interested</option>
            </select>
          </div>

          <div>
            <label className="text-[11px] uppercase tracking-wide text-white/40">
              Notes (matches, rewards, daily coupon cap)
            </label>
            <textarea
              className="mt-1 min-h-28 w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm"
              value={form.notes}
              onChange={(e) =>
                setForm((f) => ({ ...f, notes: e.target.value }))
              }
              placeholder="Willing to host Spurs vs Arsenal. Offers $5 off food, 15 coupons/day."
            />
          </div>

          <Button
            disabled={loading}
            className="w-full rounded-xl bg-[#FFFC00] text-black"
            onClick={() => void submit()}
          >
            {loading ? "Submitting…" : "Submit visit"}
          </Button>
          {error && <p className="text-sm text-red-400">{error}</p>}
          {result && <p className="text-sm text-emerald-400">{result}</p>}
        </div>

        <Link
          href="/map"
          className={cn(buttonVariants({ variant: "ghost" }), "rounded-xl")}
        >
          Back to map
        </Link>
      </div>
    </div>
  );
}
