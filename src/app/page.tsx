"use client";

import { Suspense, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { LandingScreen } from "@/components/auth/LandingScreen";

function AuthedRedirect() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.replace("/map");
    }
  }, [isAuthenticated, isLoading, router]);

  return null;
}

export default function HomePage() {
  return (
    <>
      <Suspense fallback={null}>
        <AuthedRedirect />
      </Suspense>
      <LandingScreen />
    </>
  );
}
