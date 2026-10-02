import { describe, expect, it } from "vitest";
import { generateOtp, hashOtp, otpMatches } from "../src/lib/otp";

const SECRET = "unit-test-otp-secret-long-enough-1234";
const USER = "3f1c2a8e-8a8b-4c4a-9a51-2f6c0e2b7d10";

describe("OTP generation", () => {
  it("always produces a 6-digit numeric string, keeping leading zeros", () => {
    for (let i = 0; i < 2_000; i++) expect(generateOtp()).toMatch(/^\d{6}$/);
  });

  it("does not repeat the same code in a small sample", () => {
    const codes = new Set(Array.from({ length: 200 }, generateOtp));
    expect(codes.size).toBeGreaterThan(190);
  });
});

describe("OTP hashing", () => {
  it("never stores the code itself", () => {
    const hash = hashOtp("123456", USER, SECRET);
    expect(hash).not.toContain("123456");
    expect(hash).toMatch(/^[0-9a-f]{64}$/);
  });

  it("gives the same code different hashes for different users and secrets", () => {
    const base = hashOtp("123456", USER, SECRET);
    expect(hashOtp("123456", "another-user", SECRET)).not.toBe(base);
    expect(hashOtp("123456", USER, "a-different-secret-that-is-long-12345")).not.toBe(base);
  });

  it("matches only the exact code for the same user", () => {
    const hash = hashOtp("004821", USER, SECRET);
    expect(otpMatches("004821", USER, hash, SECRET)).toBe(true);
    expect(otpMatches("004822", USER, hash, SECRET)).toBe(false);
    expect(otpMatches("4821", USER, hash, SECRET)).toBe(false);
    expect(otpMatches("004821", "another-user", hash, SECRET)).toBe(false);
  });
});
