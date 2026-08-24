import Image from "next/image";
import { cn } from "@/lib/utils";

/** Bare crest — no tile, no circle, no dashed well. The real artwork sits
 *  directly on the card colour. Decorative: the team name is always adjacent. */
export function Crest({
  src,
  size = "list",
  className,
}: {
  src?: string;
  size?: "list" | "side";
  className?: string;
}) {
  const dimension =
    size === "side" ? "var(--crest-side)" : "var(--crest-list)";

  return (
    <span
      className={cn("relative block shrink-0", className)}
      style={{ width: dimension, height: dimension }}
    >
      {src ? (
        <Image
          src={src}
          alt=""
          fill
          sizes="66px"
          className="object-contain"
          unoptimized
        />
      ) : null}
    </span>
  );
}
