import nodemailer from "nodemailer";
import { OTP } from "../config/limits";
import { otpEmail } from "./email/otp-email";

export interface Mailer {
  sendOtp(to: string, code: string): Promise<void>;
}

type SmtpSettings = {
  host: string;
  port: number;
  secure: boolean;
  user?: string;
  pass?: string;
  from: string;
};

export function createSmtpMailer(settings: SmtpSettings): Mailer {
  const transport = nodemailer.createTransport({
    host: settings.host,
    port: settings.port,
    secure: settings.secure,
    auth: settings.user ? { user: settings.user, pass: settings.pass } : undefined,
  });

  return {
    async sendOtp(to, code) {
      await transport.sendMail({ from: settings.from, to, ...otpEmail(code, OTP.ttlMs / 60_000) });
    },
  };
}
