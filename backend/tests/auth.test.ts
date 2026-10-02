import { eq } from "drizzle-orm";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { users } from "../src/db/schema";
import { createTestApp, createVerifiedUser, MINUTE, PASSWORD, registerUser, type TestApp } from "./helpers/test-app";

const EMAIL = "ravi@example.com";
let t: TestApp;

beforeAll(async () => {
  t = await createTestApp();
});
beforeEach(() => t.reset());
afterAll(() => t.close());

const login = (password = PASSWORD, email = EMAIL) => t.api.post("/api/auth/login").send({ email, password });

describe("register", () => {
  it("hashes the password with bcrypt", async () => {
    await registerUser(t, EMAIL);
    const [user] = await t.db.select().from(users).where(eq(users.email, EMAIL));
    expect(user.passwordHash).toMatch(/^\$2[aby]\$/);
    expect(user.passwordHash).not.toContain(PASSWORD);
  });

  it("normalises the email and reports field errors", async () => {
    const ok = await registerUser(t, "  Ravi@Example.COM ");
    expect(ok.body.email).toBe(EMAIL);

    const bad = await t.api
      .post("/api/auth/register")
      .send({ email: "not-an-email", password: "short", confirmPassword: "different" });
    expect(bad.status).toBe(400);
    expect(bad.body.error.fields).toMatchObject({
      email: "Enter a valid email address.",
      password: "Use at least 8 characters.",
    });
  });

  it("rejects passwords that don't match", async () => {
    const res = await t.api
      .post("/api/auth/register")
      .send({ email: EMAIL, password: PASSWORD, confirmPassword: "Secret124" });
    expect(res.body.error.fields).toEqual({ confirmPassword: "Passwords don't match." });
  });

  it("only requires 8 characters, with no letter or number rules", async () => {
    expect((await registerUser(t, EMAIL, "onlyletters")).status).toBe(201);

    const tooShort = await registerUser(t, "short@example.com", "seven77");
    expect(tooShort.body.error.fields).toEqual({ password: "Use at least 8 characters." });
  });

  it("blocks a verified email but lets an unverified one be claimed again", async () => {
    await registerUser(t, EMAIL, "FirstPass1");
    t.advance(MINUTE);
    const again = await registerUser(t, EMAIL, "SecondPass2");
    expect(again.status).toBe(201);

    await t.api.post("/api/auth/verify-email").send({ email: EMAIL, code: t.lastCode(EMAIL) });
    expect((await login("SecondPass2")).status).toBe(200);
    expect((await registerUser(t, EMAIL)).body.error.code).toBe("EMAIL_TAKEN");
  });
});

describe("login", () => {
  it("returns a session for a verified user", async () => {
    await createVerifiedUser(t, EMAIL);
    const res = await login();
    expect(res.status).toBe(200);
    expect(res.body.user).toMatchObject({ email: EMAIL, profileCompleted: false });

    const me = await t.api.get("/api/me").set("Authorization", `Bearer ${res.body.token}`);
    expect(me.body.user.email).toBe(EMAIL);
  });

  it("sends unverified users back to verification with a fresh code", async () => {
    await registerUser(t, EMAIL);
    t.advance(MINUTE);
    const res = await login();
    expect(res.status).toBe(403);
    expect(res.body.error).toMatchObject({ code: "EMAIL_NOT_VERIFIED", email: EMAIL, resendAvailableInSeconds: 30 });
    expect(t.outbox).toHaveLength(2);
  });

  it("does not reveal unverified status to someone with the wrong password", async () => {
    await registerUser(t, EMAIL);
    const res = await login("WrongPass1");
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe("INVALID_CREDENTIALS");
  });

  it("gives the same answer for a wrong password and an unknown email", async () => {
    await createVerifiedUser(t, EMAIL);
    const wrongPassword = await login("WrongPass1");
    const unknownEmail = await login(PASSWORD, "ghost@example.com");
    expect(wrongPassword.status).toBe(401);
    expect(unknownEmail.body).toEqual(wrongPassword.body);
  });

  it("locks the account for 15 minutes after 5 failed attempts", async () => {
    await createVerifiedUser(t, EMAIL);
    for (let i = 0; i < 4; i++) expect((await login("WrongPass1")).status).toBe(401);

    const fifth = await login("WrongPass1");
    expect(fifth.status).toBe(429);
    expect(fifth.body.error.code).toBe("ACCOUNT_LOCKED");
    expect((await login()).body.error.code).toBe("ACCOUNT_LOCKED");

    t.advance(15 * MINUTE);
    expect((await login()).status).toBe(200);
  });

  it("resets the failure count after a successful login", async () => {
    await createVerifiedUser(t, EMAIL);
    for (let i = 0; i < 4; i++) await login("WrongPass1");
    expect((await login()).status).toBe(200);
    expect((await login("WrongPass1")).status).toBe(401);
  });
});

describe("session token", () => {
  it("rejects missing, malformed and expired tokens", async () => {
    const { token } = await createVerifiedUser(t, EMAIL);

    expect((await t.api.get("/api/me")).body.error.code).toBe("UNAUTHENTICATED");
    expect((await t.api.get("/api/me").set("Authorization", "Bearer nope")).status).toBe(401);

    t.advance(7 * 24 * 60 * MINUTE + 1_000);
    const expired = await t.api.get("/api/me").set("Authorization", `Bearer ${token}`);
    expect(expired.status).toBe(401);
    expect(expired.body.error.code).toBe("SESSION_EXPIRED");
  });
});
