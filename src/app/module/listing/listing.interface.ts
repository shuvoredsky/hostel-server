import { ListingType, AdvanceOption, GenderPreference } from '../../../generated';

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
  studentDiscountPercent?: number;
  advanceOption?: AdvanceOption;
  genderPreference?: GenderPreference;
  allowHalfMonthlyPay?: boolean;
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
  studentDiscountPercent?: number;
  advanceOption?: AdvanceOption;
  genderPreference?: GenderPreference;
  allowHalfMonthlyPay?: boolean;
}

export interface IListingFilterPayload {
  type?: ListingType;
  area?: string;
  city?: string;
  minPrice?: number;
  maxPrice?: number;
  isAvailable?: boolean;
  search?: string;
  sortBy?: 'price' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
  genderPreference?: GenderPreference;
  hasDiscount?: boolean;
}