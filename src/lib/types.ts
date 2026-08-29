import { User, PersonalProfile, BusinessPage } from '@prisma/client';

export type UserWithProfile = User & {
  personalProfile?: PersonalProfile | null;
};

export type ProfileWithRelations = PersonalProfile & {
  user: User;
};

export type BusinessWithRelations = BusinessPage & {
  owner: User;
};

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface SearchParams {
  query?: string;
  category?: string;
  emirate?: string;
  city?: string;
  area?: string;
  type?: 'personal' | 'business';
  verified?: boolean;
  page?: number;
  limit?: number;
}

export interface LocationCoordinates {
  lat: number;
  lng: number;
}

export interface BusinessLocation {
  emirate: string;
  city: string;
  area: string;
  address: string;
  coordinates: LocationCoordinates;
}

export interface BusinessHours {
  [day: string]: {
    open: string;
    close: string;
  } | null;
}

export interface BusinessContact {
  email?: string;
  phone?: string;
  whatsapp?: string;
  website?: string;
}
