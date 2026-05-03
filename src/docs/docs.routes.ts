import { Router } from "express";
import swaggerUi from "swagger-ui-express";
import { openApiSpec } from "./openapi";

export function docsRoutes(): Router {
  const router = Router();

  router.get("/docs.json", (_, res) => res.json(openApiSpec));
  router.use("/docs", swaggerUi.serve, swaggerUi.setup(openApiSpec));

  return router;
}
