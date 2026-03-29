import { create } from 'zustand';
import type { PublicUser, CompatibilityResult } from '@roomy/types';

export interface SwipeProfile extends PublicUser {
  compatibilityScore?: number;
  dimScores?: CompatibilityResult['dimScores'];
  flags?: CompatibilityResult['flags'];
  hardBlock?: boolean;
}

interface SwipeStore {
  deck: SwipeProfile[];
  deckIndex: number;
  setDeck: (profiles: SwipeProfile[]) => void;
  nextCard: () => void;
  resetDeck: () => void;
}

export const useSwipeStore = create<SwipeStore>((set) => ({
  deck: [],
  deckIndex: 0,
  setDeck: (profiles) => set({ deck: profiles, deckIndex: 0 }),
  nextCard: () => set((state) => ({ deckIndex: state.deckIndex + 1 })),
  resetDeck: () => set({ deck: [], deckIndex: 0 }),
}));
