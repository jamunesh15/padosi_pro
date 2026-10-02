import { loadEnv } from "./config/env";
import { PASSWORD_ROUNDS } from "./config/limits";
import { createApp } from "./create-app";
import { createDb } from "./db/client";
import { createSmtpMailer } from "./lib/mailer";

const env = loadEnv();

// Default export is what Vercel runs as a function; server.ts adds app.listen for local runs.
const app = createApp({
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

export default app;
