/**
 * Common types used across the platform
 * Migrated from apps/backend/src/api/types/common.ts
 */

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

export interface Coordinates {
  lat: number;
  lng: number;
}

export interface DateRange {
  start: string;
  end: string;
}

export interface FileUploadResponse {
  url: string;
  publicId: string;
  format: string;
  width: number;
  height: number;
  bytes: number;
}

export interface Location {
  latitude?: number;
  longitude?: number;
  address?: string;
  city: string;
  country: string;
  venueName?: string;
}

export interface SocialLinks {
  twitter?: string;
  instagram?: string;
  linkedin?: string;
  facebook?: string;
  website?: string;
}
