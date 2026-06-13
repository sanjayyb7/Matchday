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
      className="group flex flex-col items-center"
      aria-label={`Open ${pub.name}`}
    >
      <div className="relative h-14 w-14 overflow-hidden rounded-full border-2 border-white shadow-lg ring-2 ring-primary/50 transition-transform group-hover:scale-110">
        <Image
          src={pub.imageUrl}
          alt={pub.name}
          fill
          className="object-cover"
          unoptimized
        />
      </div>
      <span className="mt-1 max-w-[80px] truncate rounded-full bg-background/90 px-2 py-0.5 text-[10px] font-semibold text-foreground shadow">
        {pub.name}
      </span>
    </button>
  );
}
