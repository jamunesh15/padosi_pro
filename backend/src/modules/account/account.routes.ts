import { Router } from "express";
import type { AppDeps } from "../../deps";
import { currentUserId, requireAuth } from "../../middleware/require-auth";
import { profileBody } from "../profile/profile.schemas";
import { saveProfile } from "../profile/profile.service";
import { taskSelectionBody } from "../tasks/tasks.schemas";
import { getSelectedTasks, saveSelectedTasks } from "../tasks/tasks.service";
import { getAccount } from "./account.service";

export function accountRoutes(deps: AppDeps) {
  const router = Router();
  router.use(requireAuth(deps));

  router.get("/", async (_req, res) => {
    res.json({ user: await getAccount(deps.db, currentUserId(res)) });
  });

  router.put("/profile", async (req, res) => {
    const userId = currentUserId(res);
    await saveProfile(deps, userId, profileBody.parse(req.body));
    res.json({ user: await getAccount(deps.db, userId) });
  });

  router.get("/tasks", async (_req, res) => {
    res.json({ tasks: await getSelectedTasks(deps.db, currentUserId(res)) });
  });

  router.put("/tasks", async (req, res) => {
    const { taskIds } = taskSelectionBody.parse(req.body);
    res.json({ tasks: await saveSelectedTasks(deps, currentUserId(res), taskIds) });
  });

  return router;
}
