import { z } from 'zod';

const bdPhoneNumberRegex = /^01\d{9}$/;

const registerOwnerZodSchema = z.object({
  name: z.string().min(1, 'Name is required').min(3, 'Name must be at least 3 characters'),
  email: z.string().min(1, 'Email is required').email('Invalid email address'),
  password: z.string().min(1, 'Password is required').min(6, 'Password must be at least 6 characters'),
  whatsappNumber: z
    .string()
    .min(1, 'WhatsApp number is required')
    .regex(bdPhoneNumberRegex, 'WhatsApp number must be 11 digits and start with 01'),
});

export const AuthValidation = {
  registerOwnerZodSchema,
};
