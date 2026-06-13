import type { Transition, Variants } from "framer-motion";

/** Strong ease-out — UI enters should feel instant, not sluggish. */
export const EASE_OUT: Transition["ease"] = [0.23, 1, 0.32, 1];

export const MOTION_FAST = 0.16;
export const MOTION_UI = 0.22;
export const MOTION_ENTER = 0.24;

export function uiTransition(reduced: boolean, duration = MOTION_UI): Transition {
  return reduced ? { duration: 0 } : { duration, ease: EASE_OUT };
}

export function enterVariants(reduced: boolean): Variants {
  if (reduced) {
    return {
      initial: { opacity: 1 },
      animate: { opacity: 1 },
      exit: { opacity: 1 },
    };
  }
  return {
    initial: { opacity: 0, y: 8, scale: 0.98 },
    animate: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: { duration: MOTION_ENTER, ease: EASE_OUT },
    },
    exit: {
      opacity: 0,
      y: 4,
      scale: 0.98,
      transition: { duration: MOTION_FAST, ease: EASE_OUT },
    },
  };
}

export function staggerContainer(reduced: boolean, stagger = 0.045): Variants {
  if (reduced) {
    return { hidden: {}, show: {} };
  }
  return {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: stagger, delayChildren: 0.06 },
    },
  };
}

export function staggerItem(reduced: boolean): Variants {
  if (reduced) {
    return { hidden: {}, show: {} };
  }
  return {
    hidden: { opacity: 0, y: 6, scale: 0.95 },
    show: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: { duration: MOTION_UI, ease: EASE_OUT },
    },
  };
}
