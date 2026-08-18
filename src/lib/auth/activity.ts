export const LAST_ACTIVITY_KEY = "matchday:lastActivity";

export function clearLastActivity() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(LAST_ACTIVITY_KEY);
}
