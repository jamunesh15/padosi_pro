import cors from "cors";
import express from "express";
import helmet from "helmet";
import type { AppDeps } from "./deps";
import { errorHandler, notFound } from "./middleware/error-handler";
import { accountRoutes } from "./modules/account/account.routes";
import { authRoutes } from "./modules/auth/auth.routes";
import { taskRoutes } from "./modules/tasks/tasks.routes";

export function createApp(deps: AppDeps) {
  const app = express();

  app.use(helmet());
  app.use(cors({ origin: deps.config.corsOrigins }));
  app.use(express.json({ limit: "20kb" }));

  app.get("/api/health", (_req, res) => {
    res.json({ ok: true });
  });
  app.use("/api/auth", authRoutes(deps));
  app.use("/api/tasks", taskRoutes(deps));
  app.use("/api/me", accountRoutes(deps));

  app.use(notFound);
  app.use(errorHandler);
  return app;
}
