"use client";

import { Suspense, useEffect } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { LoginForm } from "@/components/auth/LoginForm";
import { useAuth } from "@/hooks/useAuth";

const HERO_IMAGE = "/assets/landing-hero-pub.png";

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
};

function LoginRedirect() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.replace("/map");
    }
  }, [isAuthenticated, isLoading, router]);

  return null;
}

export default function LoginPage() {
  return (
    <main className="h-dvh overflow-hidden bg-black p-[5px]">
      {/* Soft-edged hero container inset 5px from every side */}
      <div className="relative flex h-full w-full flex-col overflow-hidden rounded-[20px] shadow-[0_0_60px_rgba(0,0,0,0.6)]">
        {/* Background: photo → grain → tint */}
        <div className="absolute inset-0">
          <Image
            src={HERO_IMAGE}
            alt="Fans cheering at a sports bar during the match"
            fill
            priority
            sizes="100vw"
            className="object-cover object-center brightness-[0.8]"
          />
          <div
            aria-hidden
            className="bg-noise pointer-events-none absolute inset-0"
          />
          <div className="pointer-events-none absolute inset-0 bg-[#1a1008]/30" />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[62%] bg-gradient-to-t from-black/88 via-black/50 to-transparent" />
          <div className="pointer-events-none absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-black/50 to-transparent" />
        </div>

        {/* Top logo */}
        <motion.div
          {...fadeUp}
          transition={{ duration: 0.5 }}
          className="relative z-10 flex justify-center pt-8"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#FFFC00] shadow-[0_8px_32px_rgba(255,252,0,0.4)]">
            <span className="font-heading text-lg font-bold text-black">LD</span>
          </div>
        </motion.div>

        {/* Bottom-anchored content */}
        <div className="relative z-10 mt-auto w-full pb-4 sm:pb-8">
          <div className="mx-auto w-full max-w-sm px-6 text-center">
            <motion.h1
              {...fadeUp}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="font-heading text-5xl font-medium leading-none tracking-normal sm:text-6xl"
            >
              <span className="text-white">Welcome </span>
              <span className="text-[#FFFC00]">back</span>
            </motion.h1>

            <motion.p
              {...fadeUp}
              transition={{ delay: 0.3, duration: 0.5 }}
              className="mx-auto mt-4 max-w-[300px] text-base leading-relaxed text-white/85"
            >
              Log in to rejoin your squad and keep your matchday streak going.
            </motion.p>
          </div>

          <Suspense fallback={null}>
            <LoginRedirect />
          </Suspense>
          <Suspense fallback={<div className="h-40" />}>
            <LoginForm />
          </Suspense>
        </div>
      </div>
    </main>
  );
}
