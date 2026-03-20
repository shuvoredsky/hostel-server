import { ListingType } from '../../../generated/enums';

export interface ICreateListingPayload {
  title: string;
  description: string;
  type: ListingType;
  price: number;
  address: string;
  area: string;
  city?: string;
  totalRooms?: number;
  totalSeats?: number;
}

export interface IUpdateListingPayload {
  title?: string;
  description?: string;
  price?: number;
  address?: string;
  area?: string;
  city?: string;
  totalRooms?: number;
  totalSeats?: number;
  isAvailable?: boolean;
}

export interface IListingFilterPayload {
  type?: ListingType;
  area?: string;
  city?: string;
  minPrice?: number;
  maxPrice?: number;
  isAvailable?: boolean;
}