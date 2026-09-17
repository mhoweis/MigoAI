// src/store/savedEventsStore.ts
import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from '../services/api';
import { Event } from '@migo/shared';

interface SavedEventsStore {
  savedEvents: Event[];
  savedIds: Set<string>;
  isLoading: boolean;
  loadSavedEvents: () => Promise<void>;
  toggleSaved: (event: Event) => Promise<void>;
  isSaved: (eventId: string) => boolean;
  clearSaved: () => Promise<void>;
}

export const useSavedEventsStore = create<SavedEventsStore>((set, get) => ({
  savedEvents: [],
  savedIds: new Set(),
  isLoading: false,

  loadSavedEvents: async () => {
    try {
      set({ isLoading: true });
      const response = await api.get('/wishlists');
      if (response.data.success) {
        const events: Event[] = response.data.data.wishlists;
        const ids = new Set<string>(events.map((e) => e.id));
        set({ savedEvents: events, savedIds: ids, isLoading: false });
        await AsyncStorage.setItem('savedEvents', JSON.stringify(events));
        return;
      }
    } catch {
      // fall through to local cache
    }
    try {
      const stored = await AsyncStorage.getItem('savedEvents');
      if (stored) {
        const events: Event[] = JSON.parse(stored);
        const ids = new Set<string>(events.map((e) => e.id));
        set({ savedEvents: events, savedIds: ids });
      }
    } catch {}
    set({ isLoading: false });
  },

  toggleSaved: async (event: Event) => {
    const { savedIds, savedEvents } = get();
    const alreadySaved = savedIds.has(event.id);

    // Optimistic update
    if (alreadySaved) {
      const newIds = new Set(savedIds);
      newIds.delete(event.id);
      const newEvents = savedEvents.filter((e) => e.id !== event.id);
      set({ savedIds: newIds, savedEvents: newEvents });
      await AsyncStorage.setItem('savedEvents', JSON.stringify(newEvents));
      try { await api.delete(`/wishlists/${event.id}`); } catch {}
    } else {
      const newIds = new Set(savedIds);
      newIds.add(event.id);
      const newEvents = [event, ...savedEvents];
      set({ savedIds: newIds, savedEvents: newEvents });
      await AsyncStorage.setItem('savedEvents', JSON.stringify(newEvents));
      try { await api.post(`/wishlists/${event.id}`); } catch {}
    }
  },

  isSaved: (eventId: string) => get().savedIds.has(eventId),

  clearSaved: async () => {
    set({ savedEvents: [], savedIds: new Set() });
    await AsyncStorage.removeItem('savedEvents');
  },
}));
