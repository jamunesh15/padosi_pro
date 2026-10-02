import { and, desc, eq, isNull, lt, sql } from "drizzle-orm";
import { OTP } from "../../config/limits";
import { emailOtps, users } from "../../db/schema";
import type { AppDeps } from "../../deps";
import { AppError, secondsUntil } from "../../lib/errors";
import { generateOtp, hashOtp, otpMatches } from "../../lib/otp";

type Recipient = { id: string; email: string };

const HOUR_MS = 60 * 60_000;

export async function sendVerificationCode({ db, mailer, now, config }: AppDeps, user: Recipient) {
  const current = now();
  const recent = await db
    .select({ createdAt: emailOtps.createdAt })
    .from(emailOtps)
    .where(eq(emailOtps.userId, user.id))
    .orderBy(desc(emailOtps.createdAt))
    .limit(OTP.maxPerHour);

  const latest = recent[0];
  if (latest) {
    const resendAt = new Date(latest.createdAt.getTime() + OTP.resendCooldownMs);
    if (resendAt > current) {
      const wait = secondsUntil(resendAt, current);
      throw new AppError(429, "OTP_COOLDOWN", `Please wait ${wait}s before requesting a new code.`, { retryAfterSeconds: wait });
    }
  }

  const sentThisHour = recent.filter((row) => current.getTime() - row.createdAt.getTime() < HOUR_MS);
  if (sentThisHour.length >= OTP.maxPerHour) {
    const oldest = sentThisHour[sentThisHour.length - 1];
    const wait = secondsUntil(new Date(oldest.createdAt.getTime() + HOUR_MS), current);
    throw new AppError(429, "OTP_LIMIT", `Too many codes requested. Try again in ${Math.ceil(wait / 60)} min.`, {
      retryAfterSeconds: wait,
    });
  }

  const code = generateOtp();
  const [otp] = await db
    .insert(emailOtps)
    .values({
      userId: user.id,
      codeHash: hashOtp(code, user.id, config.otpSecret),
      expiresAt: new Date(current.getTime() + OTP.ttlMs),
      createdAt: current,
    })
    .returning({ id: emailOtps.id });

  try {
    await mailer.sendOtp(user.email, code);
  } catch (error) {
    // Drop the unsent code so the cooldown doesn't block an immediate retry.
    await db.delete(emailOtps).where(eq(emailOtps.id, otp.id));
    console.error("OTP email failed", error);
    throw new AppError(502, "EMAIL_NOT_SENT", "We couldn't send the email. Please try again.");
  }

  return { resendAvailableInSeconds: OTP.resendCooldownMs / 1000 };
}

// Used where a code should go out if allowed, but a cooldown or hourly limit must not fail the request.
export async function sendVerificationCodeIfAllowed(deps: AppDeps, user: Recipient) {
  try {
    return await sendVerificationCode(deps, user);
  } catch (error) {
    if (error instanceof AppError && error.status === 429) {
      return { resendAvailableInSeconds: Number(error.details?.retryAfterSeconds ?? 0) };
    }
    throw error;
  }
}

export async function confirmVerificationCode({ db, now, config }: AppDeps, userId: string, code: string) {
  const current = now();
  const [otp] = await db
    .select()
    .from(emailOtps)
    .where(eq(emailOtps.userId, userId))
    .orderBy(desc(emailOtps.createdAt))
    .limit(1);

  if (!otp || otp.usedAt) throw noActiveCode();
  if (otp.expiresAt <= current) throw new AppError(400, "OTP_EXPIRED", "This code has expired. Request a new one.");
  if (otp.attempts >= OTP.maxAttempts) throw tooManyAttempts();

  if (!otpMatches(code, userId, otp.codeHash, config.otpSecret)) {
    // Increment in SQL so parallel guesses can't slip past the attempt limit.
    const [counted] = await db
      .update(emailOtps)
      .set({ attempts: sql`${emailOtps.attempts} + 1` })
      .where(and(eq(emailOtps.id, otp.id), lt(emailOtps.attempts, OTP.maxAttempts)))
      .returning({ attempts: emailOtps.attempts });

    const attemptsLeft = counted ? OTP.maxAttempts - counted.attempts : 0;
    if (attemptsLeft === 0) throw tooManyAttempts();
    const noun = attemptsLeft === 1 ? "attempt" : "attempts";
    throw new AppError(400, "OTP_INCORRECT", `Incorrect code. ${attemptsLeft} ${noun} left.`, { attemptsLeft });
  }

  await db.transaction(async (tx) => {
    const [claimed] = await tx
      .update(emailOtps)
      .set({ usedAt: current })
      .where(and(eq(emailOtps.id, otp.id), isNull(emailOtps.usedAt), lt(emailOtps.attempts, OTP.maxAttempts)))
      .returning({ id: emailOtps.id });
    if (!claimed) throw noActiveCode();
    await tx.update(users).set({ emailVerifiedAt: current }).where(eq(users.id, userId));
  });
}

const noActiveCode = () => new AppError(400, "OTP_NOT_FOUND", "This code is no longer valid. Request a new one.");

const tooManyAttempts = () =>
  new AppError(429, "OTP_LOCKED", "Too many wrong attempts. Request a new code to try again.");
