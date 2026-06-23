import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Player, Pub, UserIdentity } from "@/types";

interface MatchdayState {
  identity: UserIdentity | null;
  selectedPub: Pub | null;
  selectedPlayerId: string | null;
  showMatchReminder: boolean;
  setIdentity: (identity: UserIdentity | null) => void;
  setSelectedPub: (pub: Pub | null) => void;
  setSelectedPlayerId: (id: string | null) => void;
  openMatchReminder: () => void;
  closeMatchReminder: () => void;
  selectedPlayerProfile: Player | null;
  setSelectedPlayerProfile: (player: Player | null) => void;
}

export const useMatchdayStore = create<MatchdayState>()(
  persist(
    (set) => ({
      identity: null,
      selectedPub: null,
      selectedPlayerId: null,
      showMatchReminder: false,
      selectedPlayerProfile: null,
      setIdentity: (identity) => set({ identity }),
      setSelectedPub: (selectedPub) => set({ selectedPub }),
      setSelectedPlayerId: (selectedPlayerId) => set({ selectedPlayerId }),
      openMatchReminder: () => set({ showMatchReminder: true }),
      closeMatchReminder: () => set({ showMatchReminder: false }),
      setSelectedPlayerProfile: (selectedPlayerProfile) =>
        set({ selectedPlayerProfile }),
    }),
    {
      name: "matchday:store",
      partialize: (state) => ({ identity: state.identity }),
    },
  ),
);
