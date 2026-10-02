import type { ErrorRequestHandler, RequestHandler } from "express";
import { ZodError } from "zod";
import { AppError } from "../lib/errors";

export const notFound: RequestHandler = (req) => {
  throw new AppError(404, "NOT_FOUND", `No route for ${req.method} ${req.path}`);
};

export const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
  if (error instanceof AppError) {
    const retryAfter = error.details?.retryAfterSeconds;
    if (typeof retryAfter === "number") res.set("Retry-After", String(retryAfter));
    res.status(error.status).json({ error: { code: error.code, message: error.message, ...error.details } });
    return;
  }

  if (error instanceof ZodError) {
    const fields: Record<string, string> = {};
    for (const issue of error.issues) fields[issue.path.join(".") || "body"] ??= issue.message;
    res.status(400).json({ error: { code: "VALIDATION_ERROR", message: "Please check the highlighted fields.", fields } });
    return;
  }

  if (error?.type === "entity.parse.failed") {
    res.status(400).json({ error: { code: "INVALID_JSON", message: "Request body must be valid JSON." } });
    return;
  }

  if (error?.type === "entity.too.large") {
    res.status(413).json({ error: { code: "PAYLOAD_TOO_LARGE", message: "Request body is too large." } });
    return;
  }

  console.error(error);
  res.status(500).json({ error: { code: "INTERNAL_ERROR", message: "Something went wrong on our side. Please try again." } });
};
