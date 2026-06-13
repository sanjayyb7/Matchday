import type { Team } from "@/types";

export interface TeamChatTheme {
  stripes: string;
  watermark: string;
  accent: string;
  accentMuted: string;
}

const TEAM_CHAT_THEMES: Record<string, TeamChatTheme> = {
  spain: {
    stripes: `linear-gradient(180deg,
      rgba(198, 11, 30, 0.35) 0%,
      rgba(198, 11, 30, 0.35) 28%,
      rgba(241, 191, 0, 0.28) 28%,
      rgba(241, 191, 0, 0.28) 72%,
      rgba(198, 11, 30, 0.35) 72%,
      rgba(198, 11, 30, 0.35) 100%)`,
    watermark: "/assets/flags/spain.svg",
    accent: "#F1BF00",
    accentMuted: "#C60B1E",
  },
  france: {
    stripes: `linear-gradient(90deg,
      rgba(0, 85, 164, 0.35) 0%,
      rgba(0, 85, 164, 0.35) 33%,
      rgba(255, 255, 255, 0.12) 33%,
      rgba(255, 255, 255, 0.12) 66%,
      rgba(237, 41, 57, 0.35) 66%,
      rgba(237, 41, 57, 0.35) 100%)`,
    watermark: "/assets/flags/france.svg",
    accent: "#0055A4",
    accentMuted: "#ED2939",
  },
};

export function getTeamChatTheme(teamId: string): TeamChatTheme {
  return (
    TEAM_CHAT_THEMES[teamId] ?? {
      stripes: "linear-gradient(180deg, rgba(0,200,83,0.15), rgba(11,15,20,0.9))",
      watermark: "/assets/flags/spain.svg",
      accent: "#00C853",
      accentMuted: "#0B0F14",
    }
  );
}

export function getTeamChatThemeFromTeam(team?: Team): TeamChatTheme {
  return getTeamChatTheme(team?.id ?? "spain");
}
