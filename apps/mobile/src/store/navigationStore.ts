import { create } from 'zustand';

interface NavigationStore {
  requestedTab: string | null;
  setRequestedTab: (tab: string | null) => void;
}

/**
 * Used to request a programmatic tab switch from any screen.
 * CustomTabBar subscribes to this and performs the actual navigation
 * using its own `navigation` prop (which is confirmed to work for tab switching).
 *
 * Usage:
 *   useNavigationStore.getState().setRequestedTab('Events');
 */
export const useNavigationStore = create<NavigationStore>((set) => ({
  requestedTab: null,
  setRequestedTab: (tab) => set({ requestedTab: tab }),
}));
