export type MatchStatus = "upcoming" | "live" | "finished";

export interface Pub {
  id: string;
  name: string;
  imageUrl: string;
  lat: number;
  lng: number;
  address: string;
  neighborhood: string;
}

export interface Team {
  id: string;
  name: string;
  flagUrl: string;
  countryCode: string;
  color: string;
}

export interface Match {
  id: string;
  homeTeamId: string;
  awayTeamId: string;
  kickoff: string;
  status: MatchStatus;
  venue?: string;
}

export interface PlayerStats {
  goals: number;
  assists: number;
  caps: number;
}

export interface Player {
  id: string;
  teamId: string;
  name: string;
  number: number;
  imageUrl: string;
  age: number;
  country: string;
  position: string;
  club: string;
  stats: PlayerStats;
}

export interface UserIdentity {
  userId: string;
  matchId: string;
  teamId: string;
  playerId: string;
  updatedAt: string;
}

export interface FanPresence {
  userId: string;
  playerId: string;
  teamId: string;
  lat: number;
  lng: number;
  pubId?: string;
  distanceMeters?: number;
  isSimulated?: boolean;
}

export interface ChatMessage {
  id: string;
  teamId: string;
  matchId: string;
  userId: string;
  playerId: string;
  text: string;
  createdAt: string;
  isSimulated?: boolean;
}

export interface MatchHistoryEntry {
  id: string;
  userId: string;
  matchId: string;
  teamId: string;
  playerId: string;
  pubId?: string;
  pubName?: string;
  attendedAt: string;
  matchLabel: string;
}

export type UserRole = "fan" | "admin";

export interface AuthUser {
  id: string;
  name: string;
  email?: string;
  avatarUrl: string;
  fanSince: string;
  role: UserRole;
}

export interface SignUpInput {
  name: string;
  email?: string;
}
