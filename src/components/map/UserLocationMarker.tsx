"use client";

export function UserLocationMarker() {
  return (
    <div className="relative flex flex-col items-center">
      <div className="relative flex h-12 w-12 items-center justify-center">
        <span className="absolute h-12 w-12 animate-ping rounded-full bg-accent/30" />
        <span className="relative h-4 w-4 rounded-full border-2 border-white bg-accent shadow-lg ring-2 ring-accent/60" />
      </div>
      <span className="mt-1 rounded-full bg-primary px-2 py-0.5 text-[9px] font-bold uppercase text-primary-foreground">
        You
      </span>
    </div>
  );
}
