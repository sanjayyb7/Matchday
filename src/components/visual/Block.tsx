import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Block({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("dog-ear relative overflow-hidden", className)}>
      {children}
    </div>
  );
}
