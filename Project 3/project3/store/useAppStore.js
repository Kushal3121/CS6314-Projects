import { create } from 'zustand';

const useAppStore = create((set) => ({
  advancedEnabled: false,
  setAdvancedEnabled: (enabled) => set({ advancedEnabled: enabled }),
  currentUser: null,
  setCurrentUser: (user) => set({ currentUser: user }),
  clearCurrentUser: () => set({ currentUser: null }),
}));

export default useAppStore;
