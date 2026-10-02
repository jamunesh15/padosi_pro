import { Router } from "express";
import type { AppDeps } from "../../deps";
import { listCatalogue } from "./tasks.service";

export function taskRoutes(deps: AppDeps) {
  const router = Router();

  router.get("/", async (_req, res) => {
    res.json({ categories: await listCatalogue(deps.db) });
  });

  return router;
}
