import { z } from 'zod';
import { ListingType, AdvanceOption, GenderPreference } from '../../../generated';

const createListingZodSchema = z.object({
  title: z.string({ message: 'Title is required' }),
  description: z.string({ message: 'Description is required' }),
  type: z.nativeEnum(ListingType, { message: 'Invalid listing type' }),
  price: z.number({ message: 'Price is required' }),
  address: z.string({ message: 'Address is required' }),
  area: z.string({ message: 'Area is required' }),
  city: z.string().optional(),
  totalRooms: z.number().optional(),
  totalSeats: z.number().optional(),
  studentDiscountPercent: z.number().min(0).max(100).optional(),
  advanceOption: z.nativeEnum(AdvanceOption).optional(),
  genderPreference: z.nativeEnum(GenderPreference).optional(),
  allowHalfMonthlyPay: z.boolean().optional(),
});

const updateListingZodSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  price: z.number().optional(),
  address: z.string().optional(),
  area: z.string().optional(),
  city: z.string().optional(),
  totalRooms: z.number().optional(),
  totalSeats: z.number().optional(),
  isAvailable: z.boolean().optional(),
  studentDiscountPercent: z.number().min(0).max(100).optional(),
  advanceOption: z.nativeEnum(AdvanceOption).optional(),
  genderPreference: z.nativeEnum(GenderPreference).optional(),
  allowHalfMonthlyPay: z.boolean().optional(),
});

export const ListingValidation = {
  createListingZodSchema,
  updateListingZodSchema,
};