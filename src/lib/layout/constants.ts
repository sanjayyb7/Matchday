/** Floating nav footprint (~5.25rem) + comfortable gap above the pill. */
export const BOTTOM_NAV_CLEARANCE =
  "calc(7rem + env(safe-area-inset-bottom))";

/** Safe area only — when bottom nav is hidden (e.g. chat). */
export const BOTTOM_SAFE_CLEARANCE =
  "calc(0.75rem + env(safe-area-inset-bottom))";

/** Reserve space above fixed chat input (chips + pill + inset). */
export const CHAT_INPUT_CLEARANCE =
  "calc(8.25rem + env(safe-area-inset-bottom))";
