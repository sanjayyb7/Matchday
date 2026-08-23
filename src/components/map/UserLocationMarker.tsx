"use client";

export function UserLocationMarker() {
  return (
    <div className="relative flex flex-col items-center">
      <div
        className="relative h-4 w-4 rounded-full border-[3px] border-ink bg-c-lime"
        style={{ boxShadow: "var(--ring-avatar)" }}
      />
      <span className="mt-1 rounded-pill bg-ink px-2 py-1 font-display text-micro text-paper">
        You
      </span>
    </div>
  );
}
