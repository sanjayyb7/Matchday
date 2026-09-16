"use client";

import Image from "next/image";
import type { Pub } from "@/types";

interface PubMarkerProps {
  pub: Pub;
  onClick: () => void;
}

export function PubMarker({ pub, onClick }: PubMarkerProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="press-pill group flex min-h-11 flex-col items-center"
      aria-label={`Open ${pub.name}`}
    >
      <div className="relative h-12 w-12 overflow-hidden rounded-card border-[3px] border-ink bg-paper">
        <Image
          src={pub.imageUrl}
          alt={pub.name}
          fill
          className="object-cover"
          unoptimized
        />
      </div>
      <span className="mt-1 max-w-[88px] truncate rounded-pill bg-ink px-2 py-1 font-display text-micro text-paper">
        {pub.name}
      </span>
    </button>
  );
}
