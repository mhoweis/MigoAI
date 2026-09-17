// src/api/users.ts
import apiClient from './client';
import { authAPI } from './auth';

export interface UserProfile {
  id: string;
  migoId: string;
  email?: string;
  phone?: string;
  firstName?: string;
  lastName?: string;
  displayName: string;
  avatarUrl?: string;
  bio?: string;
  city?: string;
  country?: string;
  isPremium: boolean;
  isOrganizer: boolean;
  isAdmin: boolean;
  stats: {
    eventCount: number;
    bookingCount: number;
    reviewCount: number;
    followerCount: number;
    followingCount: number;
  };
  dates: {
    created: string;
    lastLogin?: string;
    lastActive?: string;
  };
}

export interface UpdateProfileData {
  firstName?: string;
  lastName?: string;
  displayName?: string;
  bio?: string;
  dateOfBirth?: string;
  gender?: string;
  preferredLanguage?: string;
  country?: string;
  city?: string;
  timezone?: string;
  preferences?: any;
  interests?: string[];
}

export interface UpdateLocationData {
  lat: number;
  lng: number;
  city: string;
  country: string;
  timezone?: string;
}

class UsersAPI {
  // Get current user profile
  async getProfile(): Promise<UserProfile> {
    const response = await apiClient.get<UserProfile>('/users/profile');
    // Update stored user data
    await authAPI.updateStoredUser(response);
    return response;
  }
  
  // Update profile
  async updateProfile(data: UpdateProfileData): Promise<UserProfile> {
    const response = await apiClient.put<UserProfile>('/users/profile', data);
    await authAPI.updateStoredUser(response);
    return response;
  }
  
  // Update location
  async updateLocation(data: UpdateLocationData): Promise<UserProfile> {
    const response = await apiClient.put<UserProfile>('/users/location', data);
    await authAPI.updateStoredUser(response);
    return response;
  }
  
  // Update profile picture
  async updateProfilePicture(imageUrl: string): Promise<UserProfile> {
    const response = await apiClient.put<UserProfile>('/users/profile/picture', { imageUrl });
    await authAPI.updateStoredUser(response);
    return response;
  }
  
  // Upload profile picture (with file)
  async uploadProfilePicture(file: any, onProgress?: (progress: number) => void): Promise<UserProfile> {
    const response = await apiClient.uploadFile('/users/profile/upload-picture', file, 'image', onProgress);
    await authAPI.updateStoredUser(response);
    return response;
  }
  
  // Update preferences
  async updatePreferences(preferences: any): Promise<UserProfile> {
    const response = await apiClient.put<UserProfile>('/users/preferences', { preferences });
    await authAPI.updateStoredUser(response);
    return response;
  }
  
  // Delete account
  async deleteAccount(): Promise<void> {
    await apiClient.delete('/users/account');
    await authAPI.clearAuthData();
  }
  
  // Get user by ID
  async getUserById(userId: string): Promise<UserProfile> {
    return apiClient.get<UserProfile>(`/users/${userId}`);
  }
  
  // Follow/Unfollow user
  async followUser(userId: string): Promise<{ following: boolean }> {
    return apiClient.post<{ following: boolean }>(`/users/${userId}/follow`);
  }
  
  async unfollowUser(userId: string): Promise<{ following: boolean }> {
    return apiClient.delete<{ following: boolean }>(`/users/${userId}/follow`);
  }
  
  // Get user's events
  async getUserEvents(userId: string, options?: { page?: number; limit?: number }) {
    const params = new URLSearchParams();
    if (options?.page) params.append('page', options.page.toString());
    if (options?.limit) params.append('limit', options.limit.toString());
    
    const query = params.toString() ? `?${params.toString()}` : '';
    return apiClient.get(`/users/${userId}/events${query}`);
  }
  
  // Get user's bookings
  async getUserBookings(userId: string, options?: { page?: number; limit?: number; status?: string }) {
    const params = new URLSearchParams();
    if (options?.page) params.append('page', options.page.toString());
    if (options?.limit) params.append('limit', options.limit.toString());
    if (options?.status) params.append('status', options.status);
    
    const query = params.toString() ? `?${params.toString()}` : '';
    return apiClient.get(`/users/${userId}/bookings${query}`);
  }
}

export const usersAPI = new UsersAPI();
export default usersAPI;