import { z } from 'zod';

const createBookingZodSchema = z.object({
  listingId: z.string({ message: 'Listing ID is required' }),
  message: z.string().optional(),
  moveInDate: z.string().optional(),
});

const updateBookingStatusZodSchema = z.object({
  status: z.enum(['ACCEPTED', 'REJECTED'], { message: 'Invalid status' }),
});

export const BookingValidation = {
  createBookingZodSchema,
  updateBookingStatusZodSchema,
};