import express from "express";
import { loadEnv } from "./config/env";
import { PASSWORD_ROUNDS } from "./config/limits";
import { createApp } from "./create-app";
import { createDb } from "./db/client";
import { createSmtpMailer } from "./lib/mailer";

const env = loadEnv();

const api = createApp({
  db: createDb(env.DATABASE_URL).db,
  mailer: createSmtpMailer({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_SECURE,
    user: env.SMTP_USER,
    pass: env.SMTP_PASS,
    from: env.MAIL_FROM,
  }),
  now: () => new Date(),
  config: {
    jwtSecret: env.JWT_SECRET,
    jwtExpiresIn: env.JWT_EXPIRES_IN,
    otpSecret: env.OTP_SECRET,
    passwordRounds: PASSWORD_ROUNDS,
    corsOrigins: env.CORS_ORIGINS === "*" ? "*" : env.CORS_ORIGINS.split(",").map((origin) => origin.trim()),
  },
});

// Vercel runs the default export as a function and only accepts an entry file that imports express itself;
// server.ts adds app.listen for local and Docker runs.
const app = express().disable("x-powered-by").use(api);

export default app;
