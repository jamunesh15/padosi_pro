import { eq, isNull, sql } from "drizzle-orm";
import { LOGIN } from "../../config/limits";
import { users } from "../../db/schema";
import type { AppDeps } from "../../deps";
import { AppError, secondsUntil } from "../../lib/errors";
import { burnPasswordCheck, hashPassword, verifyPassword } from "../../lib/password";
import { signSessionToken } from "../../lib/session-token";
import { getAccount } from "../account/account.service";
import type { LoginInput, RegisterInput, ResendInput, VerifyInput } from "./auth.schemas";
import { confirmVerificationCode, sendVerificationCode, sendVerificationCodeIfAllowed } from "./verification.service";

export async function register(deps: AppDeps, input: RegisterInput) {
  const passwordHash = await hashPassword(input.password, deps.config.passwordRounds);

  // One statement covers new, unverified and verified emails; an unverified account belongs to whoever verifies it.
  const [user] = await deps.db
    .insert(users)
    .values({ email: input.email, passwordHash, createdAt: deps.now() })
    .onConflictDoUpdate({ target: users.email, set: { passwordHash }, setWhere: isNull(users.emailVerifiedAt) })
    .returning({ id: users.id, email: users.email });

  if (!user) throw new AppError(409, "EMAIL_TAKEN", "An account with this email already exists. Please log in.");

  const delivery = await sendVerificationCodeIfAllowed(deps, user);
  return { email: user.email, ...delivery };
}

export async function verifyEmail(deps: AppDeps, input: VerifyInput) {
  const user = await findPendingUser(deps, input.email);
  await confirmVerificationCode(deps, user.id, input.code);
  return createSession(deps, user.id);
}

export async function resendCode(deps: AppDeps, input: ResendInput) {
  const user = await findPendingUser(deps, input.email);
  return sendVerificationCode(deps, user);
}

export async function login(deps: AppDeps, input: LoginInput) {
  const { db, now, config } = deps;
  const user = await findUserByEmail(deps, input.email);

  if (!user) {
    await burnPasswordCheck(input.password, config.passwordRounds);
    throw invalidCredentials();
  }

  const current = now();
  if (user.lockedUntil && user.lockedUntil > current) throw accountLocked(user.lockedUntil, current);

  if (!(await verifyPassword(input.password, user.passwordHash))) await recordFailedLogin(deps, user.id);

  if (user.failedLogins > 0 || user.lockedUntil) {
    await db.update(users).set({ failedLogins: 0, lockedUntil: null }).where(eq(users.id, user.id));
  }

  if (!user.emailVerifiedAt) {
    const delivery = await sendVerificationCodeIfAllowed(deps, user);
    throw new AppError(403, "EMAIL_NOT_VERIFIED", "Please verify your email to continue.", {
      email: user.email,
      ...delivery,
    });
  }

  return createSession(deps, user.id);
}

async function createSession(deps: AppDeps, userId: string) {
  const token = signSessionToken(userId, deps.now(), deps.config.jwtSecret, deps.config.jwtExpiresIn);
  return { token, user: await getAccount(deps.db, userId) };
}

async function findUserByEmail({ db }: AppDeps, email: string) {
  const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
  return user;
}

async function findPendingUser(deps: AppDeps, email: string) {
  const user = await findUserByEmail(deps, email);
  if (!user) throw new AppError(404, "ACCOUNT_NOT_FOUND", "No account found for this email. Please register first.");
  if (user.emailVerifiedAt) throw new AppError(409, "ALREADY_VERIFIED", "This email is already verified. Please log in.");
  return user;
}

async function recordFailedLogin({ db, now }: AppDeps, userId: string): Promise<never> {
  const [row] = await db
    .update(users)
    .set({ failedLogins: sql`${users.failedLogins} + 1` })
    .where(eq(users.id, userId))
    .returning({ failedLogins: users.failedLogins });

  if (row.failedLogins >= LOGIN.maxFailures) {
    const current = now();
    const lockedUntil = new Date(current.getTime() + LOGIN.lockMs);
    await db.update(users).set({ failedLogins: 0, lockedUntil }).where(eq(users.id, userId));
    throw accountLocked(lockedUntil, current);
  }
  throw invalidCredentials();
}

const invalidCredentials = () => new AppError(401, "INVALID_CREDENTIALS", "Incorrect email or password.");

function accountLocked(until: Date, now: Date) {
  const wait = secondsUntil(until, now);
  return new AppError(429, "ACCOUNT_LOCKED", `Too many failed attempts. Try again in ${Math.ceil(wait / 60)} min.`, {
    retryAfterSeconds: wait,
  });
}
