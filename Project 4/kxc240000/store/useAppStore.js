import { create } from 'zustand';

const useAppStore = create((set) => ({
  advancedEnabled: false,
  setAdvancedEnabled: (enabled) => set({ advancedEnabled: enabled }),
  currentUser: null,
  setCurrentUser: (user) => set({ currentUser: user }),
  clearCurrentUser: () => set({ currentUser: null }),
  // Activity refresh interval (ms) for sidebar updates
  activityRefreshMs: 5000,
  setActivityRefreshMs: (ms) => set({ activityRefreshMs: ms }),
}));

export default useAppStore;
