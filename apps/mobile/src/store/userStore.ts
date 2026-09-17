// migo-mobile/src/store/userStore.ts - UPDATED
import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authService, User } from '../services/auth.service';

interface UserStore {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  firstLogin: boolean;
  userLocation: string | null; // User's preferred city for filtering events

  // Actions
  setUser: (user: User | null) => Promise<void>;
  setFirstLogin: (value: boolean) => Promise<void>;
  updateInterests: (interests: string[]) => Promise<void>;
  setUserLocation: (city: string) => Promise<void>;
  logout: () => Promise<void>;
  loadUserFromStorage: () => Promise<void>;
  clearError: () => void;
  updateProfile: (data: Partial<User>) => Promise<void>;
}

export const useUserStore = create<UserStore>((set, get) => ({
  user: null,
  isLoading: false,
  error: null,
  firstLogin: false,
  userLocation: null, // Will be set from storage or default to 'New York'
  
  setUser: async (user) => {
    set({ user, error: null });
    if (user) {
      await AsyncStorage.setItem('user', JSON.stringify(user));
    } else {
      await AsyncStorage.removeItem('user');
    }
  },
  
  setFirstLogin: async (value: boolean) => {
    set({ firstLogin: value });
    await AsyncStorage.setItem('firstLogin', JSON.stringify(value));
  },
  
  updateInterests: async (interests) => {
    try {
      set({ isLoading: true, error: null });
      const updatedUser = await authService.updateInterests(interests);

      // Always merge locally-selected interests into the returned user object.
      // Some API responses may omit the interests field; this guarantees they are preserved.
      const userWithInterests: User = { ...updatedUser, interests };

      set({
        user: userWithInterests,
        firstLogin: false,
        isLoading: false,
      });

      await AsyncStorage.setItem('user', JSON.stringify(userWithInterests));
      await AsyncStorage.setItem('firstLogin', JSON.stringify(false));

    } catch (error: any) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  setUserLocation: async (city: string) => {
    set({ userLocation: city });
    await AsyncStorage.setItem('userLocation', city);
  },
  
  logout: async () => {
    try {
      set({ isLoading: true });
      await authService.logout();
      
      // Clear all state in one operation
      set({ 
        user: null, 
        firstLogin: false, 
        error: null, 
        isLoading: false 
      });
      
      // Clear all storage
      await AsyncStorage.multiRemove(['user', 'firstLogin', 'accessToken', 'refreshToken']);
      
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
    }
  },
  
  loadUserFromStorage: async () => {
    try {
      set({ isLoading: true });

      // Load all data atomically — localProfileAvatar / localProfileName survive logout
      const [userString, firstLoginString, accessToken, userLocation, localAvatar, localName] = await Promise.all([
        AsyncStorage.getItem('user'),
        AsyncStorage.getItem('firstLogin'),
        AsyncStorage.getItem('accessToken'),
        AsyncStorage.getItem('userLocation'),
        AsyncStorage.getItem('localProfileAvatar'),
        AsyncStorage.getItem('localProfileName'),
      ]);

      const updates: Partial<UserStore> = { isLoading: false };

      if (userString) {
        updates.user = JSON.parse(userString);
      }

      if (firstLoginString) {
        updates.firstLogin = JSON.parse(firstLoginString);
      }

      // Set user location or default to Dubai
      updates.userLocation = userLocation || 'Dubai';

      // If we have a token but no user, try to fetch user from API
      // Only do this if we actually have a valid token (not null/undefined)
      if (accessToken && accessToken.trim() !== '' && !updates.user) {
        try {
          const user = await authService.getCurrentUser();
          updates.user = user;
          await AsyncStorage.setItem('user', JSON.stringify(user));
        } catch (error) {
          console.warn('Failed to fetch user with token:', error);
          // Clear invalid token
          await AsyncStorage.multiRemove(['accessToken', 'refreshToken']);
        }
      }

      // Merge local profile overrides that survive logout/re-login.
      // localProfileAvatar: always local (no server upload in MVP).
      // localProfileName: set only when the API update failed.
      if (updates.user) {
        if (localAvatar) updates.user = { ...updates.user, avatar: localAvatar };
        if (localName)  updates.user = { ...updates.user, name: localName };
      }

      set(updates);

    } catch (error) {
      console.error('Failed to load user from storage:', error);
      set({ isLoading: false });
    }
  },
  
  clearError: () => set({ error: null }),
  
  updateProfile: async (data) => {
    try {
      set({ isLoading: true, error: null });
      const updatedUser = await authService.updateProfile(data);
      set({ user: updatedUser, isLoading: false });
      await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
    } catch {
      // API unavailable or endpoint not implemented — fall back to local-only update
      set({ isLoading: false, error: null });
      const currentUser = get().user;
      if (currentUser) {
        const updated = { ...currentUser, ...data };
        set({ user: updated });
        await AsyncStorage.setItem('user', JSON.stringify(updated));
      }
      // Do not re-throw — local update is sufficient for MVP
    }
  },
}));