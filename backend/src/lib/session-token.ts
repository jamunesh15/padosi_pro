import jwt, { type SignOptions } from "jsonwebtoken";
import { AppError } from "./errors";

const toSeconds = (date: Date) => Math.floor(date.getTime() / 1000);

export function signSessionToken(userId: string, now: Date, secret: string, expiresIn: string): string {
  return jwt.sign({ sub: userId, iat: toSeconds(now) }, secret, {
    algorithm: "HS256",
    expiresIn: expiresIn as SignOptions["expiresIn"],
  });
}

export function readSessionToken(token: string, now: Date, secret: string): string {
  try {
    const payload = jwt.verify(token, secret, { algorithms: ["HS256"], clockTimestamp: toSeconds(now) });
    if (typeof payload === "string" || !payload.sub) throw new Error("Token has no subject");
    return payload.sub;
  } catch {
    throw new AppError(401, "SESSION_EXPIRED", "Your session has expired. Please log in again.");
  }
}
