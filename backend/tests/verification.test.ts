import { eq } from "drizzle-orm";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { emailOtps, users } from "../src/db/schema";
import { confirmVerificationCode } from "../src/modules/auth/verification.service";
import { createTestApp, MINUTE, registerUser, type TestApp } from "./helpers/test-app";

const EMAIL = "asha@example.com";
let t: TestApp;

beforeAll(async () => {
  t = await createTestApp();
});
beforeEach(() => t.reset());
afterAll(() => t.close());

const verify = (code: string, email = EMAIL) => t.api.post("/api/auth/verify-email").send({ email, code });
const resend = (email = EMAIL) => t.api.post("/api/auth/resend-code").send({ email });
const wrongCode = (code: string) => (code === "000000" ? "111111" : "000000");

describe("sending a code", () => {
  it("emails a 6-digit code on register and stores only its hash", async () => {
    const res = await registerUser(t, EMAIL);
    expect(res.status).toBe(201);
    expect(res.body).toEqual({ email: EMAIL, resendAvailableInSeconds: 30 });

    const code = t.lastCode(EMAIL);
    expect(code).toMatch(/^\d{6}$/);
    const [row] = await t.db.select().from(emailOtps);
    expect(row.codeHash).not.toContain(code);
  });

  it("enforces a 30 second resend cooldown", async () => {
    await registerUser(t, EMAIL);
    t.advance(10_000);

    const early = await resend();
    expect(early.status).toBe(429);
    expect(early.body.error.code).toBe("OTP_COOLDOWN");
    expect(early.body.error.retryAfterSeconds).toBe(20);
    expect(early.headers["retry-after"]).toBe("20");

    t.advance(20_000);
    expect((await resend()).status).toBe(200);
    expect(t.outbox).toHaveLength(2);
  });

  it("caps codes at 5 per hour", async () => {
    await registerUser(t, EMAIL);
    for (let i = 0; i < 4; i++) {
      t.advance(31_000);
      expect((await resend()).status).toBe(200);
    }
    t.advance(31_000);
    const res = await resend();
    expect(res.status).toBe(429);
    expect(res.body.error.code).toBe("OTP_LIMIT");
  });

  it("lets the user retry straight away when the email could not be sent", async () => {
    t.failMail(true);
    const res = await registerUser(t, EMAIL);
    expect(res.status).toBe(502);
    expect(res.body.error.code).toBe("EMAIL_NOT_SENT");

    t.failMail(false);
    expect((await resend()).status).toBe(200);
  });

  it("rejects resend for unknown or already verified emails", async () => {
    expect((await resend("nobody@example.com")).body.error.code).toBe("ACCOUNT_NOT_FOUND");

    await registerUser(t, EMAIL);
    await verify(t.lastCode(EMAIL));
    t.advance(MINUTE);
    expect((await resend()).body.error.code).toBe("ALREADY_VERIFIED");
  });
});

describe("verifying a code", () => {
  it("verifies the email and returns a session for the right code", async () => {
    await registerUser(t, EMAIL);
    const res = await verify(t.lastCode(EMAIL));

    expect(res.status).toBe(200);
    expect(res.body.token).toEqual(expect.any(String));
    expect(res.body.user).toMatchObject({ email: EMAIL, profileCompleted: false, selectedTaskCount: 0 });
    const [user] = await t.db.select().from(users).where(eq(users.email, EMAIL));
    expect(user.emailVerifiedAt).not.toBeNull();
  });

  it("accepts a code just before 10 minutes and rejects it after", async () => {
    await registerUser(t, EMAIL);
    const code = t.lastCode(EMAIL);

    t.advance(10 * MINUTE);
    const expired = await verify(code);
    expect(expired.status).toBe(400);
    expect(expired.body.error.code).toBe("OTP_EXPIRED");

    t.advance(-1_000);
    expect((await verify(code)).status).toBe(200);
  });

  it("counts down attempts and locks the code after 5 wrong tries", async () => {
    await registerUser(t, EMAIL);
    const code = t.lastCode(EMAIL);

    for (const left of [4, 3, 2, 1]) {
      const res = await verify(wrongCode(code));
      expect(res.status).toBe(400);
      expect(res.body.error).toMatchObject({ code: "OTP_INCORRECT", attemptsLeft: left });
    }

    const fifth = await verify(wrongCode(code));
    expect(fifth.status).toBe(429);
    expect(fifth.body.error.code).toBe("OTP_LOCKED");

    const correctButLocked = await verify(code);
    expect(correctButLocked.body.error.code).toBe("OTP_LOCKED");
  });

  it("accepts a fresh code after the old one was locked", async () => {
    await registerUser(t, EMAIL);
    for (let i = 0; i < 5; i++) await verify(wrongCode(t.lastCode(EMAIL)));

    t.advance(31_000);
    await resend();
    expect((await verify(t.lastCode(EMAIL))).status).toBe(200);
  });

  it("only accepts the latest code once a new one is sent", async () => {
    await registerUser(t, EMAIL);
    const first = t.lastCode(EMAIL);
    t.advance(31_000);
    await resend();
    const second = t.lastCode(EMAIL);

    if (first !== second) expect((await verify(first)).body.error.code).toBe("OTP_INCORRECT");
    expect((await verify(second)).status).toBe(200);
  });

  it("uses each code only once", async () => {
    await registerUser(t, EMAIL);
    const code = t.lastCode(EMAIL);
    const [user] = await t.db.select().from(users).where(eq(users.email, EMAIL));

    await confirmVerificationCode(t.deps, user.id, code);
    await expect(confirmVerificationCode(t.deps, user.id, code)).rejects.toMatchObject({ code: "OTP_NOT_FOUND" });
  });

  it("validates the code format before touching the database", async () => {
    await registerUser(t, EMAIL);
    const res = await verify("12ab");
    expect(res.status).toBe(400);
    expect(res.body.error).toMatchObject({ code: "VALIDATION_ERROR", fields: { code: "Enter the 6-digit code." } });
  });
});
