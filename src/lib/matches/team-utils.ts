import type { Team } from "@/types";

const TEAM_COLORS: Record<string, string> = {
  spain: "#C60B1E",
  france: "#0055A4",
  brazil: "#009C3B",
  argentina: "#75AADB",
  germany: "#000000",
  england: "#FFFFFF",
  italy: "#0064AA",
  portugal: "#006600",
  netherlands: "#FF6600",
  belgium: "#ED2939",
  usa: "#3C3B6E",
  mexico: "#006847",
};

export function teamNameToSlug(name: string): string {
  return (
    name
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") || "team"
  );
}

export function guessCountryCode(name: string, code?: string | null): string {
  if (code && code.length === 2) return code.toUpperCase();
  return teamNameToSlug(name).slice(0, 2).toUpperCase();
}

export function teamColorForSlug(slug: string): string {
  return TEAM_COLORS[slug] ?? "#334155";
}

export function mapApiTeam(
  apiTeam: { id: number; name: string; logo: string; code?: string | null },
): Team {
  const id = teamNameToSlug(apiTeam.name);
  return {
    id,
    name: apiTeam.name,
    flagUrl: apiTeam.logo || `/assets/flags/${id}.svg`,
    countryCode: guessCountryCode(apiTeam.name, apiTeam.code),
    color: teamColorForSlug(id),
  };
}
