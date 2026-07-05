import { z } from 'zod';
import {
  ListingType,
  AdvanceOption,
  GenderPreference,
  Amenity,
  GasType,
  NearbyLandmarkType,
} from '../../../generated';

const requireNearbyNameWhenTypeExists = (
  data: { nearbyType?: NearbyLandmarkType | null; nearbyName?: string | null },
  ctx: z.RefinementCtx,
) => {
  if (data.nearbyType && !data.nearbyName?.trim()) {
    ctx.addIssue({
      code: 'custom',
      message: 'Nearby name is required when nearby type is provided',
      path: ['nearbyName'],
    });
  }
};

const createListingZodSchema = z
  .object({
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
    amenities: z.array(z.nativeEnum(Amenity)).optional().default([]),
    gasType: z.nativeEnum(GasType).optional(),
    nearbyType: z.nativeEnum(NearbyLandmarkType).optional(),
    nearbyName: z.string().optional(),
  })
  .superRefine(requireNearbyNameWhenTypeExists);

const updateListingZodSchema = z
  .object({
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
    amenities: z.array(z.nativeEnum(Amenity)).optional(),
    gasType: z.nativeEnum(GasType).optional(),
    nearbyType: z.nativeEnum(NearbyLandmarkType).optional(),
    nearbyName: z.string().optional(),
  })
  .superRefine(requireNearbyNameWhenTypeExists);

export const ListingValidation = {
  createListingZodSchema,
  updateListingZodSchema,
};
