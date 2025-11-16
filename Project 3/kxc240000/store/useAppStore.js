import { create } from 'zustand';

const useAppStore = create((set) => ({
  advancedEnabled: false,
  setAdvancedEnabled: (enabled) => set({ advancedEnabled: enabled }),
}));

export default useAppStore;
