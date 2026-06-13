import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Player, Pub, UserIdentity } from "@/types";

interface MatchdayState {
  identity: UserIdentity | null;
  selectedPub: Pub | null;
  selectedPlayerId: string | null;
  showMatchModal: boolean;
  matchModalStep: "team" | "player";
  selectedTeamId: string | null;
  setIdentity: (identity: UserIdentity | null) => void;
  setSelectedPub: (pub: Pub | null) => void;
  setSelectedPlayerId: (id: string | null) => void;
  openMatchModal: () => void;
  closeMatchModal: () => void;
  setMatchModalStep: (step: "team" | "player") => void;
  setSelectedTeamId: (teamId: string | null) => void;
  selectedPlayerProfile: Player | null;
  setSelectedPlayerProfile: (player: Player | null) => void;
}

export const useMatchdayStore = create<MatchdayState>()(
  persist(
    (set) => ({
      identity: null,
      selectedPub: null,
      selectedPlayerId: null,
      showMatchModal: false,
      matchModalStep: "team",
      selectedTeamId: null,
      selectedPlayerProfile: null,
      setIdentity: (identity) => set({ identity }),
      setSelectedPub: (selectedPub) => set({ selectedPub }),
      setSelectedPlayerId: (selectedPlayerId) => set({ selectedPlayerId }),
      openMatchModal: () =>
        set({ showMatchModal: true, matchModalStep: "team", selectedTeamId: null }),
      closeMatchModal: () =>
        set({ showMatchModal: false, matchModalStep: "team", selectedTeamId: null }),
      setMatchModalStep: (matchModalStep) => set({ matchModalStep }),
      setSelectedTeamId: (selectedTeamId) => set({ selectedTeamId }),
      setSelectedPlayerProfile: (selectedPlayerProfile) =>
        set({ selectedPlayerProfile }),
    }),
    {
      name: "matchday:store",
      partialize: (state) => ({ identity: state.identity }),
    },
  ),
);
