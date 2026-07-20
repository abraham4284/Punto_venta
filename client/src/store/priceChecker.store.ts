import { create } from "zustand";

interface PriceCheckerState {
  isOpen: boolean;
  openPriceChecker: () => void;
  closePriceChecker: () => void;
  togglePriceChecker: () => void;
}

export const usePriceCheckerStore = create<PriceCheckerState>((set) => ({
  isOpen: false,
  openPriceChecker: () => set({ isOpen: true }),
  closePriceChecker: () => set({ isOpen: false }),
  togglePriceChecker: () => {
    set((state) => ({ isOpen: !state.isOpen }));
  },
}));
