"use client";

import { useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { INSFORGE_ENABLED } from "@/lib/insforge/config";

const HERO_IMAGE = "/assets/landing-hero-pub.png";

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
};

export function LandingScreen() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const handleGoogle = () => {
    startTransition(() => {
      if (INSFORGE_ENABLED) {
        window.location.assign("/api/auth/oauth/google");
      } else {
        router.push("/signup");
      }
    });
  };

  return (
    <main className="h-dvh overflow-hidden bg-black p-5">
      {/* Soft-edged hero container inset 20px from every side */}
      <div className="relative flex h-full w-full flex-col overflow-hidden rounded-[28px] shadow-[0_0_60px_rgba(0,0,0,0.6)]">
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
        <div className="relative z-10 mt-auto w-full">
          <div className="mx-auto flex w-full max-w-md flex-col px-6 pb-8 sm:pb-12">
            <motion.div
              {...fadeUp}
              transition={{ delay: 0.15, duration: 0.5 }}
              className="mb-4 inline-flex w-fit items-center gap-2 rounded-full bg-black/40 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-white backdrop-blur-sm"
            >
              <span className="live-pulse h-2 w-2 rounded-full bg-[#FFFC00]" />
              Live soccer · Find your SF pub
            </motion.div>

            <motion.h1
              {...fadeUp}
              transition={{ delay: 0.25, duration: 0.5 }}
              className="font-heading text-5xl font-medium leading-none tracking-normal sm:text-7xl"
            >
              <span className="text-[#FFFC00]">Local</span>
              <span className="text-white">Derby</span>
            </motion.h1>

            <motion.p
              {...fadeUp}
              transition={{ delay: 0.35, duration: 0.5 }}
              className="mt-4 max-w-[340px] text-base leading-relaxed text-white/85"
            >
              Find the pub showing the match, pick your player, and join your
              team&apos;s squad chat — live with the fans around you.
            </motion.p>

            <motion.div
              {...fadeUp}
              transition={{ delay: 0.45, duration: 0.5 }}
              className="mt-7 flex flex-col gap-4"
            >
              <button
                type="button"
                disabled={pending}
                onClick={handleGoogle}
                className="group inline-flex w-full items-center justify-center gap-2 whitespace-nowrap rounded-full bg-[#FFFC00] px-6 py-4 text-base font-bold text-black shadow-[0_8px_28px_rgba(255,252,0,0.35)] transition-transform active:scale-[0.98] disabled:opacity-60"
              >
                Continue with Google
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </button>
              <p className="text-center text-sm text-white/60">
                Already have an account?{" "}
                <Link
                  href="/login"
                  className="font-semibold text-[#FFFC00] hover:underline"
                >
                  Log in
                </Link>
              </p>
            </motion.div>
          </div>
        </div>
      </div>
    </main>
  );
}
