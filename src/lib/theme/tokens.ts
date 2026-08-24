/** JS mirror of `src/app/tokens.css`. Use only where CSS variables cannot
 *  reach — Mapbox styles, next/font config, inline SVG. */

export const color = {
  ink: "#0C0C0C",
  paper: "#FFFFFF",
  live: "#F0533A",

  lime: "#DDF56B",
  pink: "#F9C9DB",
  blue: "#8FB2F7",
  mint: "#CFF0D8",
  amber: "#F7C86A",

  inkMuted: "rgba(12,12,12,.35)",
  inkLabel: "rgba(12,12,12,.5)",

  ghost: "#DFDFDF",
  squadNumber: "#E4E4E4",
  divider: "#F0F0F0",
  skeleton: "#EDEDED",
  fold: "rgba(255,255,255,.5)",

  chatBg: "#141414",
  chatIncoming: "#262626",
  chatText: "#F2F2F2",
  chatHairline: "rgba(255,255,255,.1)",
  chatQuickBorder: "rgba(255,255,255,.28)",
  chatInputFill: "rgba(255,255,255,.05)",
} as const;

/** Card colour cycle, in the order the reference runs them. */
export const matchBlockColors = [
  color.lime,
  color.pink,
  color.blue,
  color.mint,
  color.amber,
] as const;

export const type = {
  display: 'var(--font-display-face), "Arial Black", Impact, sans-serif',
  utility: 'var(--font-utility-face), "Helvetica Neue", Arial, sans-serif',
  displayTracking: -0.5,
  microTracking: 1.5,
} as const;

/** Coupled values — overlap must exceed the corner cut, and padBottom must
 *  be overlap + ~16px, or names collide with the next card. */
export const card = {
  cut: 32,
  overlap: 36,
  padBottom: 52,
  padTop: 20,
  radiusTopLeft: 22,
} as const;

export const layout = {
  gut: 20,
  headerPadTop: 46,
  headerPadBottom: 72,
  crestList: 56,
  crestSide: 66,
  wellPlayer: 48,
  avatarSquad: 52,
  scoreColumn: 66,
  tapMin: 44,
  pillMin: 46,
  sendSize: 52,
  tabOffset: 26,
  tabPad: 7,
  listClearance: 110,
} as const;

export const shape = {
  radiusPill: 100,
  radiusWell: 12,
  borderInk: 2,
  borderQuick: 1.5,
  hairline: 1,
  dogEar:
    "polygon(0 0, calc(100% - 32px) 0, 100% 32px, 100% 100%, 0 100%)",
  fold: "polygon(0 0, 100% 100%, 0 100%)",
} as const;

/** The only shadow in the app. */
export const shadow = {
  tab: "0 8px 24px rgba(12,12,12,.18)",
} as const;

export const motion = {
  pressMs: 140,
  uiMs: 180,
  slowMs: 220,
  viewMs: 340,
  easeOut: "ease-out",
  easeView: "cubic-bezier(.22,1,.36,1)",
  /** The deliberate pause before the player pick advances. */
  advanceDelayMs: 180,
} as const;

export const focus = {
  ring: `3px solid ${color.live}`,
  offset: 3,
} as const;
