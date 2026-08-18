"use client";

import { Suspense } from "react";
import { AuthHero } from "@/components/auth/AuthHero";
import { SignupForm } from "@/components/auth/SignupForm";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

function SignupRedirect() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.replace("/map");
    }
  }, [isAuthenticated, isLoading, router]);

  return null;
}

export default function SignupPage() {
  return (
    <main className="relative flex min-h-screen flex-col overflow-hidden bg-[#1a1033]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,rgba(255,252,0,0.12)_0%,transparent_55%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_80%_80%,rgba(0,212,255,0.08)_0%,transparent_50%)]" />
      <AuthHero
        title="Join LocalDerby"
        subtitle="Create your fan profile, pick a player, and find the pub squad in SF."
      />
      <Suspense fallback={null}>
        <SignupRedirect />
      </Suspense>
      <SignupForm />
    </main>
  );
}
