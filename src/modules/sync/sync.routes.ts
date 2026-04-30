import { Router } from "express";
import { SyncController } from "./sync.controller";

export function syncRoutes(controller: SyncController): Router {
  const router = Router();
  router.post("/sync", (req, res) => controller.sync(req, res));
  return router;
}