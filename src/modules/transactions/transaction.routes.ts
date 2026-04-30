import { Router } from "express";
import { TransactionController } from "./transaction.controller";

export function transactionRoutes(controller: TransactionController): Router {
  const router = Router();

  router.get("/transactions", (req, res) => controller.index(req, res));
  router.get("/transactions/:id", (req, res) => controller.show(req, res));
  router.get("/transactions/:transactionId/installments", (req, res) => controller.installments(req, res));
  router.get("/transactions/:transactionId/installments/:installmentId", (req, res) => controller.installment(req, res));
  router.get("/transactions/:transactionId/payers", (req, res) => controller.payer(req, res));

  return router;
}