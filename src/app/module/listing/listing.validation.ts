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
    googleMapsLink: z
      .string()
      .url({ message: 'Invalid URL format' })
      .refine(
        (val) => {
          return (
            val.includes('google.com/maps') ||
            val.includes('goo.gl') ||
            val.includes('maps.app.goo.gl')
          );
        },
        {
          message: 'Please enter a valid Google Maps link (google.com/maps, goo.gl, or maps.app.goo.gl)',
        },
      )
      .optional()
      .or(z.literal('')),
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
    googleMapsLink: z
      .string()
      .url({ message: 'Invalid URL format' })
      .refine(
        (val) => {
          return (
            val.includes('google.com/maps') ||
            val.includes('goo.gl') ||
            val.includes('maps.app.goo.gl')
          );
        },
        {
          message: 'Please enter a valid Google Maps link (google.com/maps, goo.gl, or maps.app.goo.gl)',
        },
      )
      .optional()
      .or(z.literal('')),
  })
  .superRefine(requireNearbyNameWhenTypeExists);

export const ListingValidation = {
  createListingZodSchema,
  updateListingZodSchema,
};
