import { z } from 'zod';

const createReviewZodSchema = z.object({
  listingId: z.string({ message: 'Listing ID is required' }),
  rating: z
    .number({ message: 'Rating is required' })
    .min(1, 'Rating must be at least 1')
    .max(5, 'Rating must be at most 5'),
  comment: z.string().optional(),
});

export const ReviewValidation = {
  createReviewZodSchema,
};