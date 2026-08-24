/** Clears the floating tab pill: 110px bar+offset plus the home-indicator. */
export const BOTTOM_NAV_CLEARANCE =
  "calc(var(--list-clearance) + env(safe-area-inset-bottom))";

/** Safe area only — when bottom nav is hidden (e.g. chat). */
export const BOTTOM_SAFE_CLEARANCE =
  "calc(0.75rem + env(safe-area-inset-bottom))";

/** Reserve space above fixed chat input (chips + pill + inset). */
export const CHAT_INPUT_CLEARANCE =
  "calc(8.75rem + env(safe-area-inset-bottom))";

/** Same, minus the quick-reply chip row once the user has started chatting. */
export const CHAT_INPUT_CLEARANCE_COMPACT =
  "calc(6rem + env(safe-area-inset-bottom))";
