import { z } from 'zod';

// Mirrors the server rules so mistakes show inline before a request is sent.
const email = z
  .string()
  .trim()
  .min(1, 'Enter your email.')
  .pipe(z.email('Enter a valid email address.'));

export const registerSchema = z
  .object({
    email,
    password: z
      .string()
      .min(1, 'Enter a password.')
      .min(8, 'Use at least 8 characters.')
      .max(72, 'Use 72 characters or fewer.'),
    confirmPassword: z.string().min(1, 'Confirm your password.'),
  })
  .refine((values) => values.password === values.confirmPassword, {
    path: ['confirmPassword'],
    error: "Passwords don't match.",
  });

export const loginSchema = z.object({
  email,
  password: z.string().min(1, 'Enter your password.'),
});

export const profileSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Enter your name.')
    .min(2, 'Enter your full name.')
    .max(80, 'Name is too long.')
    .regex(/^\p{L}[\p{L} .'-]*$/u, 'Use letters, spaces, dots, apostrophes or hyphens only.'),
  mobile: z
    .string()
    .min(1, 'Enter your mobile number.')
    .regex(/^[6-9]\d{9}$/, 'Enter a valid 10-digit Indian mobile number.'),
  addressLine1: z
    .string()
    .trim()
    .min(3, 'Enter your flat, building and street.')
    .max(120, 'Address line 1 is too long.'),
  addressLine2: z.string().trim().max(120, 'Address line 2 is too long.'),
  city: z
    .string()
    .trim()
    .min(2, 'Enter your city.')
    .max(60, 'City is too long.')
    .regex(/^\p{L}[\p{L} .'-]*$/u, 'Use letters only for the city.'),
  state: z.string().min(1, 'Choose your state.'),
  pincode: z
    .string()
    .min(1, 'Enter your PIN code.')
    .regex(/^[1-9]\d{5}$/, 'Enter a valid 6-digit PIN code.'),
  businessName: z.string().trim().max(120, 'Business name is too long.'),
});

export type RegisterValues = z.infer<typeof registerSchema>;
export type LoginValues = z.infer<typeof loginSchema>;
export type ProfileValues = z.infer<typeof profileSchema>;
