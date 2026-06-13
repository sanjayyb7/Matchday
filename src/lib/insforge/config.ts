export const INSFORGE_ENABLED =
  process.env.NEXT_PUBLIC_USE_INSFORGE === "true";

export const INSFORGE_URL = process.env.NEXT_PUBLIC_INSFORGE_URL ?? "";
export const INSFORGE_ANON_KEY =
  process.env.NEXT_PUBLIC_INSFORGE_ANON_KEY ?? "";
export const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3002";
