export const OTP = {
  length: 6,
  ttlMs: 10 * 60_000,
  maxAttempts: 5,
  resendCooldownMs: 30_000,
  maxPerHour: 5,
} as const;

export const LOGIN = {
  maxFailures: 5,
  lockMs: 15 * 60_000,
} as const;

export const PASSWORD_ROUNDS = 12;
