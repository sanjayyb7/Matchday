/** JS mirror of `src/app/tokens.css`. Use only where CSS variables cannot. */

export const color = {
  ink: "#0C0C0C",
  paper: "#FFFFFF",
  live: "#F0533A",
  lime: "#DDF56B",
  pink: "#F9C9DB",
  blue: "#8FB2F7",
  mint: "#CFF0D8",
  amber: "#F7C86A",
  pitch: "#BFE9CC",
  land: "#ECEBE8",
  block: "#E2E1DD",
  water: "#C9DCF7",
  inkMuted: "rgba(12,12,12,.38)",
  inkMutedSoft: "rgba(12,12,12,.35)",
  inkMutedStrong: "rgba(12,12,12,.42)",
  inkFaint: "rgba(12,12,12,.22)",
  fold: "rgba(255,255,255,.55)",
  ghost: "#E0E0E0",
  ghostFill: "#EDEDED",
  chatIncoming: "#F2F2F2",
} as const;

export const matchBlockColors = [
  color.lime,
  color.pink,
  color.blue,
  color.mint,
  color.amber,
] as const;

export const type = {
  display: 'var(--font-anton), "Arial Black", Impact, sans-serif',
  utility: 'var(--font-archivo), "Helvetica Neue", Arial, sans-serif',
} as const;

export const radius = {
  block: 22,
  card: 16,
  ticket: 16,
  pill: 100,
  fold: 32,
} as const;

export const space = {
  tapMin: 44,
  ctaMin: 56,
  borderInk: 2,
  borderWell: 1.6,
  focusOffset: 3,
} as const;

export const motion = {
  pressMs: 140,
  uiMs: 150,
  sheetMs: 300,
  easeOut: "ease-out",
  easeSheet: "cubic-bezier(.22,1,.36,1)",
} as const;

export const clip = {
  dogEar:
    "polygon(0 0, calc(100% - 32px) 0, 100% 32px, 100% 100%, 0 100%)",
} as const;

/** Flat double-ring — the only allowed box-shadow. */
export const ring = {
  avatar: `0 0 0 3px ${color.paper}, 0 0 0 6px ${color.lime}`,
} as const;
