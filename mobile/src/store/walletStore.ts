// src/store/walletStore.ts
import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface Ticket {
  id: string;
  eventTitle: string;
  eventDate: string;        // ISO string
  venueName: string;
  city: string;
  holderName: string;
  seatInfo?: string;
  ticketType?: string;
  confirmationCode: string;
  category?: string;
  coverImage?: string;
  price?: string;
  currency?: string;
}

interface WalletStore {
  tickets: Ticket[];
  loadTickets: () => Promise<void>;
  addTicket: (ticket: Ticket) => Promise<void>;
  removeTicket: (id: string) => Promise<void>;
  upcomingTickets: () => Ticket[];
}

export const useWalletStore = create<WalletStore>((set, get) => ({
  tickets: [],

  loadTickets: async () => {
    try {
      const stored = await AsyncStorage.getItem('walletTickets');
      if (stored) set({ tickets: JSON.parse(stored) });
    } catch {}
  },

  addTicket: async (ticket: Ticket) => {
    const tickets = [ticket, ...get().tickets];
    set({ tickets });
    await AsyncStorage.setItem('walletTickets', JSON.stringify(tickets));
  },

  removeTicket: async (id: string) => {
    const tickets = get().tickets.filter((t) => t.id !== id);
    set({ tickets });
    await AsyncStorage.setItem('walletTickets', JSON.stringify(tickets));
  },

  upcomingTickets: () => {
    const now = new Date();
    return get().tickets.filter((t) => new Date(t.eventDate) >= now);
  },
}));
