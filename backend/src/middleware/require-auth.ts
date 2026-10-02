import type { RequestHandler, Response } from "express";
import { eq } from "drizzle-orm";
import { users } from "../db/schema";
import type { AppDeps } from "../deps";
import { AppError } from "../lib/errors";
import { readSessionToken } from "../lib/session-token";

export function requireAuth({ db, now, config }: AppDeps): RequestHandler {
  return async (req, res, next) => {
    const [scheme, token] = (req.get("authorization") ?? "").split(" ");
    if (scheme !== "Bearer" || !token) throw new AppError(401, "UNAUTHENTICATED", "Please log in to continue.");

    const userId = readSessionToken(token, now(), config.jwtSecret);
    const [user] = await db.select({ id: users.id }).from(users).where(eq(users.id, userId)).limit(1);
    if (!user) throw new AppError(401, "SESSION_EXPIRED", "Your session has expired. Please log in again.");

    res.locals.userId = user.id;
    next();
  };
}

export const currentUserId = (res: Response): string => res.locals.userId;
