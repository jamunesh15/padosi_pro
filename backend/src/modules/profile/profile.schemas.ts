import { z } from "zod";
import { INDIAN_STATES } from "./indian-states";

// Accepts "98765 43210", "+91-98765-43210" or "098765 43210" and stores "+919876543210".
export const mobileField = z
  .string({ error: "Enter your mobile number." })
  .trim()
  .transform((value) => value.replace(/[\s-]/g, "").replace(/^(\+91|91|0)(?=\d{10}$)/, ""))
  .pipe(z.string().regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit Indian mobile number."))
  .transform((digits) => `+91${digits}`);

const optionalText = (max: number, message: string) =>
  z
    .string({ error: "Must be text." })
    .trim()
    .max(max, message)
    .nullish()
    .transform((value) => value || null);

export const profileBody = z.object(
  {
    name: z
      .string({ error: "Enter your name." })
      .trim()
      .min(2, "Enter your full name.")
      .max(80, "Name is too long.")
      .regex(/^\p{L}[\p{L} .'-]*$/u, "Use letters, spaces, dots, apostrophes or hyphens only."),
    mobile: mobileField,
    addressLine1: z
      .string({ error: "Enter your flat, building and street." })
      .trim()
      .min(3, "Enter your flat, building and street.")
      .max(120, "Address line 1 is too long."),
    addressLine2: optionalText(120, "Address line 2 is too long."),
    city: z
      .string({ error: "Enter your city." })
      .trim()
      .min(2, "Enter your city.")
      .max(60, "City is too long.")
      .regex(/^\p{L}[\p{L} .'-]*$/u, "Use letters only for the city."),
    state: z.enum(INDIAN_STATES, { error: "Choose your state." }),
    pincode: z
      .string({ error: "Enter your PIN code." })
      .trim()
      .regex(/^[1-9]\d{5}$/, "Enter a valid 6-digit PIN code."),
    businessName: optionalText(120, "Business name is too long."),
  },
  { error: "Request body must be a JSON object." },
);

export type ProfileInput = z.infer<typeof profileBody>;
