import path from "node:path";
import { PGlite } from "@electric-sql/pglite";
import { sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";
import request from "supertest";
import { createApp } from "../../src/create-app";
import { seedCatalogue } from "../../src/db/catalogue";
import * as schema from "../../src/db/schema";
import type { AppDeps } from "../../src/deps";

export const PASSWORD = "Secret123";

// One in-memory Postgres per test file; reset() wipes users between tests and rewinds the clock.
export async function createTestApp() {
  const client = new PGlite();
  const db = drizzle({ client, schema });
  await migrate(db, { migrationsFolder: path.join(__dirname, "../../drizzle") });
  await seedCatalogue(db);

  const start = new Date("2026-01-01T10:00:00Z");
  let clock = start;
  const outbox: { to: string; code: string }[] = [];
  let mailFails = false;

  const deps: AppDeps = {
    db,
    mailer: {
      async sendOtp(to, code) {
        if (mailFails) throw new Error("SMTP down");
        outbox.push({ to, code });
      },
    },
    now: () => new Date(clock),
    config: {
      jwtSecret: "test-jwt-secret-that-is-long-enough-123",
      jwtExpiresIn: "7d",
      otpSecret: "test-otp-secret-that-is-long-enough-123",
      passwordRounds: 4,
      corsOrigins: "*",
    },
  };

  const api = request(createApp(deps));

  return {
    api,
    db,
    deps,
    outbox,
    advance(ms: number) {
      clock = new Date(clock.getTime() + ms);
    },
    failMail(fail: boolean) {
      mailFails = fail;
    },
    lastCode(email: string) {
      const sent = outbox.filter((mail) => mail.to === email).at(-1);
      if (!sent) throw new Error(`No code sent to ${email}`);
      return sent.code;
    },
    async reset() {
      await db.execute(sql`truncate users cascade`);
      outbox.length = 0;
      clock = start;
      mailFails = false;
    },
    close: () => client.close(),
  };
}

export type TestApp = Awaited<ReturnType<typeof createTestApp>>;

export function registerUser(t: TestApp, email: string, password = PASSWORD) {
  return t.api.post("/api/auth/register").send({ email, password, confirmPassword: password });
}

export async function createVerifiedUser(t: TestApp, email: string) {
  await registerUser(t, email);
  const res = await t.api.post("/api/auth/verify-email").send({ email, code: t.lastCode(email) });
  return { token: res.body.token as string, user: res.body.user };
}

export const MINUTE = 60_000;
