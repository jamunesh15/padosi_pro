import { Router } from "express";
import type { AppDeps } from "../../deps";
import { loginBody, registerBody, resendBody, verifyBody } from "./auth.schemas";
import { login, register, resendCode, verifyEmail } from "./auth.service";

export function authRoutes(deps: AppDeps) {
  const router = Router();

  router.post("/register", async (req, res) => {
    res.status(201).json(await register(deps, registerBody.parse(req.body)));
  });

  router.post("/verify-email", async (req, res) => {
    res.json(await verifyEmail(deps, verifyBody.parse(req.body)));
  });

  router.post("/resend-code", async (req, res) => {
    res.json(await resendCode(deps, resendBody.parse(req.body)));
  });

  router.post("/login", async (req, res) => {
    res.json(await login(deps, loginBody.parse(req.body)));
  });

  return router;
}
