import { createHmac, randomInt, timingSafeEqual } from "node:crypto";
import { OTP } from "../config/limits";

export function generateOtp(): string {
  return randomInt(0, 10 ** OTP.length)
    .toString()
    .padStart(OTP.length, "0");
}

// Keyed with a server secret so a leaked table can't be brute-forced offline; the user id makes equal codes hash differently.
export function hashOtp(code: string, userId: string, secret: string): string {
  return createHmac("sha256", secret).update(`${userId}:${code}`).digest("hex");
}

export function otpMatches(code: string, userId: string, storedHash: string, secret: string): boolean {
  const expected = Buffer.from(storedHash, "hex");
  const actual = Buffer.from(hashOtp(code, userId, secret), "hex");
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}
