import { api } from './api';
import { Event, ApiResponse } from '@migo/shared';

export interface EventFilters {
  category?: string;
  city?: string;
  dateFrom?: string;
  dateTo?: string;
  minPrice?: number;
  maxPrice?: number;
  search?: string;
  page?: number;
  limit?: number;
}

export interface CreateEventData {
  title: string;
  description: string;
  category: string;
  date: string;
  time: string;
  location: string;
  city: string;
  country: string;
  price: number;
  capacity: number;
  image?: string;
  tags?: string[];
}

export const eventService = {
  async getEvents(filters?: EventFilters): Promise<Event[]> {
    try {
      const response = await api.get<ApiResponse<{ events: Event[]; pagination: any }>>('/events', { params: filters });
      // Extract events array from nested response structure
      return response.data.data?.events || [];
    } catch (error: any) {
      console.error('Get events error:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch events');
    }
  },

  async getEvent(id: string): Promise<Event> {
    try {
      const response = await api.get<ApiResponse<Event>>(`/events/${id}`);
      // Extract event from nested response structure
      return response.data.data as Event;
    } catch (error: any) {
      console.error('Get event error:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch event');
    }
  },

  async createEvent(data: CreateEventData): Promise<Event> {
    try {
      const response = await api.post<ApiResponse<Event>>('/events', data);
      return response.data.data as Event;
    } catch (error: any) {
      console.error('Create event error:', error);
      throw new Error(error.response?.data?.message || 'Failed to create event');
    }
  },

  async updateEvent(id: string, data: Partial<CreateEventData>): Promise<Event> {
    try {
      const response = await api.put<ApiResponse<Event>>(`/events/${id}`, data);
      return response.data.data as Event;
    } catch (error: any) {
      console.error('Update event error:', error);
      throw new Error(error.response?.data?.message || 'Failed to update event');
    }
  },

  async deleteEvent(id: string): Promise<void> {
    try {
      await api.delete(`/events/${id}`);
    } catch (error: any) {
      console.error('Delete event error:', error);
      throw new Error(error.response?.data?.message || 'Failed to delete event');
    }
  },

  async bookmarkEvent(eventId: string): Promise<void> {
    try {
      await api.post(`/events/${eventId}/bookmark`);
    } catch (error: any) {
      console.error('Bookmark event error:', error);
      throw new Error(error.response?.data?.message || 'Failed to bookmark event');
    }
  },

  async unbookmarkEvent(eventId: string): Promise<void> {
    try {
      await api.delete(`/events/${eventId}/bookmark`);
    } catch (error: any) {
      console.error('Unbookmark event error:', error);
      throw new Error(error.response?.data?.message || 'Failed to unbookmark event');
    }
  },

  async bookEvent(eventId: string, tickets: any[]): Promise<any> {
    try {
      const response = await api.post(`/events/${eventId}/book`, { tickets });
      return response.data;
    } catch (error: any) {
      console.error('Book event error:', error);
      throw new Error(error.response?.data?.message || 'Failed to book event');
    }
  },

  async getBookmarkedEvents(): Promise<Event[]> {
    try {
      const response = await api.get<Event[]>('/events/bookmarked');
      return response.data;
    } catch (error: any) {
      console.error('Get bookmarked events error:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch bookmarked events');
    }
  },

  async getEventsByOrganizer(): Promise<Event[]> {
    try {
      const response = await api.get<Event[]>('/events/organizer');
      return response.data;
    } catch (error: any) {
      console.error('Get organizer events error:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch organizer events');
    }
  },
};