"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { clearLastActivity, LAST_ACTIVITY_KEY } from "@/lib/auth/activity";

const INACTIVITY_TIMEOUT_MS = 30 * 60 * 1000;
/** Throttle localStorage writes so activity events stay cheap. */
const ACTIVITY_WRITE_INTERVAL_MS = 30 * 1000;
const CHECK_INTERVAL_MS = 60 * 1000;

const ACTIVITY_EVENTS = [
  "pointerdown",
  "keydown",
  "scroll",
  "touchstart",
] as const;

/**
 * Signs the user out after 30 minutes without any user activity.
 *
 * The last-activity timestamp lives in localStorage so the timeout spans
 * tabs and reloads: returning to the app after the idle window has passed
 * logs the user out immediately on arrival.
 */
export function useInactivityLogout() {
  const { isAuthenticated, signOut } = useAuth();
  const router = useRouter();
  const signingOutRef = useRef(false);

  useEffect(() => {
    if (!isAuthenticated) return;

    // Seed the timestamp only when absent so a stored (possibly stale) value
    // from a previous visit is still honored by the initial idle check below.
    if (!localStorage.getItem(LAST_ACTIVITY_KEY)) {
      localStorage.setItem(LAST_ACTIVITY_KEY, String(Date.now()));
    }

    let lastWrite = 0;
    const recordActivity = () => {
      const now = Date.now();
      if (now - lastWrite < ACTIVITY_WRITE_INTERVAL_MS) return;
      lastWrite = now;
      localStorage.setItem(LAST_ACTIVITY_KEY, String(now));
    };

    const checkIdle = () => {
      if (signingOutRef.current) return;
      const lastActivity = Number(localStorage.getItem(LAST_ACTIVITY_KEY));
      if (!Number.isFinite(lastActivity) || lastActivity <= 0) {
        localStorage.setItem(LAST_ACTIVITY_KEY, String(Date.now()));
        return;
      }
      if (Date.now() - lastActivity < INACTIVITY_TIMEOUT_MS) return;

      signingOutRef.current = true;
      clearLastActivity();
      void signOut()
        .catch(() => {})
        .finally(() => {
          signingOutRef.current = false;
          router.replace("/login");
        });
    };

    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") checkIdle();
    };

    ACTIVITY_EVENTS.forEach((event) =>
      window.addEventListener(event, recordActivity, { passive: true }),
    );
    document.addEventListener("visibilitychange", onVisibilityChange);
    const interval = window.setInterval(checkIdle, CHECK_INTERVAL_MS);

    // Catch sessions that idled out while the app was closed.
    checkIdle();

    return () => {
      ACTIVITY_EVENTS.forEach((event) =>
        window.removeEventListener(event, recordActivity),
      );
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.clearInterval(interval);
    };
  }, [isAuthenticated, signOut, router]);
}
