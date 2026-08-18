"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { INSFORGE_ENABLED } from "@/lib/insforge/config";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function MatchdayMatchaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAuthenticated, isAdmin, isLoading } = useAuth();
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (isLoading) return;

    if (!INSFORGE_ENABLED) {
      setReady(true);
      return;
    }

    if (!isAuthenticated) {
      router.replace("/login");
      return;
    }

    if (!isAdmin) {
      router.replace("/map");
      return;
    }

    setReady(true);
  }, [isAuthenticated, isAdmin, isLoading, router]);

  if (isLoading || !ready) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-background">
        <div className="live-pulse h-3 w-3 rounded-full bg-primary" />
      </div>
    );
  }

  if (!INSFORGE_ENABLED) {
    return (
      <div className="mx-auto flex min-h-dvh max-w-lg flex-col justify-center gap-4 px-4 py-8">
        <h1 className="font-heading text-2xl font-bold uppercase tracking-wide">
          Matchday Matcha
        </h1>
        <p className="text-sm text-muted-foreground">
          Pub management requires InsForge backend mode. Set{" "}
          <code className="rounded bg-muted px-1">NEXT_PUBLIC_USE_INSFORGE=true</code>{" "}
          in your environment.
        </p>
        <Link
          href="/map"
          className={cn(buttonVariants({ variant: "outline", size: "lg" }), "rounded-xl")}
        >
          Back to map
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-background">
      <header className="border-b border-border/60 px-4 py-4">
        <div className="mx-auto flex max-w-lg items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-primary">
              Matchday Matcha
            </p>
            <h1 className="font-heading text-lg font-bold uppercase tracking-wide">
              Pub locations
            </h1>
          </div>
          <Link
            href="/map"
            className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "rounded-lg")}
          >
            Back to map
          </Link>
        </div>
      </header>
      <main className="mx-auto max-w-lg px-4 py-6">{children}</main>
    </div>
  );
}
