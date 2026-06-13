"use client";

import { AuthHero } from "@/components/auth/AuthHero";
import { LoginForm } from "@/components/auth/LoginForm";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function LoginPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.replace("/map");
    }
  }, [isAuthenticated, isLoading, router]);

  return (
    <main className="relative flex min-h-screen flex-col overflow-hidden bg-[#1a1033]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,rgba(255,252,0,0.12)_0%,transparent_55%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_80%_80%,rgba(0,212,255,0.08)_0%,transparent_50%)]" />
      <AuthHero
        title="Welcome back"
        subtitle="Log in to rejoin your squad and keep your matchday streak going."
      />
      <LoginForm />
    </main>
  );
}
