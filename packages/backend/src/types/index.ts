import { Request } from 'express';
import { User } from '@prisma/client';

// Extend Express Request type to include user
export interface AuthenticatedRequest extends Request {
  user?: User;
}

// Photo upload types
export interface PhotoMetadata {
  fileName: string;
  mimeType: string;
  fileSize: number;
  width?: number;
  height?: number;
  dateTaken?: Date;
  latitude?: number;
  longitude?: number;
  altitude?: number;
}

// AI Analysis types
export interface AIAnalysisResult {
  description: string;
  tags: string[];
  faces: FaceDetection[];
}

export interface FaceDetection {
  boundingBox: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  confidence: number;
}

// Search types
export interface SearchFilters {
  query?: string;
  dateFrom?: Date;
  dateTo?: Date;
  location?: string;
  people?: string[]; // Face group IDs
  tags?: string[];
  country?: string;
  city?: string;
}

export interface PhotoCluster {
  id: string;
  location: string;
  latitude: number;
  longitude: number;
  photos: Photo[];
  dateRange: {
    start: Date;
    end: Date;
  };
}

// Album types
export interface AlbumCreationParams {
  title: string;
  description?: string;
  dateRange?: {
    start: Date;
    end: Date;
  };
  location?: string;
  peopleIds?: string[];
  photoIds?: string[];
}

// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// AWS S3 types
export interface S3UploadResult {
  key: string;
  url: string;
  thumbnailUrl?: string;
}

// Geolocation types
export interface GeolocationData {
  latitude: number;
  longitude: number;
  location: string;
  country: string;
  city: string;
}