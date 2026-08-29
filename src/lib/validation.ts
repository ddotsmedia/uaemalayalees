import { z } from 'zod';

export const signupSchema = z.object({
  email: z.string().email('Invalid email format'),
  phone: z
    .string()
    .min(10, 'Phone must be at least 10 digits')
    .regex(/^\+?[\d\s\-()]{10,}$/, 'Invalid phone format'),
});

export const profileSchema = z.object({
  name: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must be less than 100 characters'),
  headline: z
    .string()
    .max(200, 'Headline must be less than 200 characters')
    .optional()
    .nullable(),
  bio: z
    .string()
    .max(500, 'Bio must be less than 500 characters')
    .optional()
    .nullable(),
  nativePlace: z.string().optional().nullable(),
  categoryId: z.string().optional().nullable(),
  offersServices: z.boolean().default(false),
});

export const businessSchema = z.object({
  name: z
    .string()
    .min(2, 'Business name must be at least 2 characters')
    .max(100, 'Business name must be less than 100 characters'),
  categoryId: z.string().min(1, 'Category is required'),
  description: z
    .string()
    .max(1000, 'Description must be less than 1000 characters')
    .optional()
    .nullable(),
  contact: z
    .object({
      phone: z.string().optional(),
      email: z.string().email().optional(),
      whatsapp: z.string().optional(),
      website: z.string().url().optional(),
    })
    .optional(),
  locations: z
    .array(
      z.object({
        emirate: z.string(),
        city: z.string(),
        area: z.string(),
        address: z.string().optional(),
        coordinates: z.object({ lat: z.number(), lng: z.number() }).optional(),
      })
    )
    .optional(),
});

export const tradelicenseSchema = z.object({
  licenseNumber: z.string().min(1, 'License number is required'),
  businessName: z.string().optional(),
  licenseExpiryDate: z.string().optional(),
});

export type SignupInput = z.infer<typeof signupSchema>;
export type ProfileInput = z.infer<typeof profileSchema>;
export type BusinessInput = z.infer<typeof businessSchema>;
export type TradeLicenseInput = z.infer<typeof tradelicenseSchema>;

export function validateInput<T>(schema: z.Schema, data: unknown): T | null {
  try {
    return schema.parse(data) as T;
  } catch (error) {
    console.error('Validation error:', error);
    return null;
  }
}
