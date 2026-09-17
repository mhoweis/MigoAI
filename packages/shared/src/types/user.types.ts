/**
 * User types
 */
import { UserRole } from '../constants';
import { SocialLinks } from './common.types';

export interface User {
  id: string;
  email: string;
  phone?: string;
  name: string;
  displayName?: string;
  bio?: string;
  avatarUrl?: string;
  coverImage?: string;

  // Location
  city?: string;
  country?: string;
  latitude?: number;
  longitude?: number;

  // Social
  website?: string;
  twitter?: string;
  instagram?: string;
  linkedin?: string;
  socialLinks?: SocialLinks;

  // Authentication
  role: UserRole;
  isEmailVerified: boolean;
  isPhoneVerified: boolean;

  // Preferences
  interests?: string[];
  preferences?: Record<string, any>;
  settings?: Record<string, any>;

  // Stats
  followerCount?: number;
  followingCount?: number;
  eventCount?: number;
  wishlistCount?: number;

  // Timestamps
  createdAt: string;
  updatedAt: string;
  lastLoginAt?: string;
}

export interface UserProfile {
  id: string;
  name: string;
  displayName?: string;
  avatarUrl?: string;
  bio?: string;
  city?: string;
  country?: string;
  website?: string;
  socialLinks?: SocialLinks;
  followerCount?: number;
  eventCount?: number;
}

export interface UserPreferences {
  interests: string[];
  notifications?: {
    email: boolean;
    push: boolean;
    sms: boolean;
  };
  language?: string;
  currency?: string;
  timezone?: string;
}
