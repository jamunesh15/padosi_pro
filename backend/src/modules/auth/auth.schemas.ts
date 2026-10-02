import { z } from "zod";

const bodyError = { error: "Request body must be a JSON object." };

export const emailField = z
  .string({ error: "Enter your email." })
  .trim()
  .toLowerCase()
  .max(254, "Email is too long.")
  .pipe(z.email("Enter a valid email address."));

// Length only, no composition rules (NIST SP 800-63B). bcrypt reads 72 bytes, so longer is rejected, not truncated.
const newPassword = z
  .string({ error: "Enter a password." })
  .min(8, "Use at least 8 characters.")
  .refine((value) => Buffer.byteLength(value, "utf8") <= 72, "Use 72 characters or fewer.");

export const registerBody = z
  .object(
    {
      email: emailField,
      password: newPassword,
      confirmPassword: z.string({ error: "Confirm your password." }),
    },
    bodyError,
  )
  .refine((body) => body.password === body.confirmPassword, {
    path: ["confirmPassword"],
    error: "Passwords don't match.",
  });

export const verifyBody = z.object(
  {
    email: emailField,
    code: z
      .string({ error: "Enter the code." })
      .trim()
      .regex(/^\d{6}$/, "Enter the 6-digit code."),
  },
  bodyError,
);

export const resendBody = z.object({ email: emailField }, bodyError);

export const loginBody = z.object(
  {
    email: emailField,
    password: z.string({ error: "Enter your password." }).min(1, "Enter your password.").max(200),
  },
  bodyError,
);

export type RegisterInput = z.infer<typeof registerBody>;
export type VerifyInput = z.infer<typeof verifyBody>;
export type ResendInput = z.infer<typeof resendBody>;
export type LoginInput = z.infer<typeof loginBody>;
