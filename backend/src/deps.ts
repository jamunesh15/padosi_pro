import type { Db } from "./db/client";
import type { Mailer } from "./lib/mailer";

export type AppConfig = {
  jwtSecret: string;
  jwtExpiresIn: string;
  otpSecret: string;
  passwordRounds: number;
  corsOrigins: string[] | "*";
};

export type AppDeps = {
  db: Db;
  mailer: Mailer;
  now: () => Date;
  config: AppConfig;
};
