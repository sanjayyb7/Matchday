import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/** The one card shape in the app: 22px top-left radius, a 32px corner cut,
 *  and a fold triangle sitting in the cut. Cards are stacked by `.card-stack`
 *  so each fold opens onto the colour of the card beneath it, never onto white. */
export const cardSurface =
  "dog-ear card-texture press-card focus-visible-live relative w-full text-left " +
  "px-[var(--gut)] pt-[var(--card-pad-t)] pb-[var(--card-pad-b)]";

/** Every card needs one of these, or the cut corner reads as a missing chunk. */
export function Fold({ className }: { className?: string } = {}) {
  return <span aria-hidden className={cn("dog-ear-fold", className)} />;
}

export function Card({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn(cardSurface, className)}>
      <Fold />
      {children}
    </div>
  );
}
