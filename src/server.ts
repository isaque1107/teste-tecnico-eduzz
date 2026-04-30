import "dotenv/config";
import express from "express";
import { runMigrations } from "./database/migrate";
import { logger } from "./shared/logger";
import { AxiosHttpClient } from "./infra/axios.http.client";
import { PagarmeAdapter } from "./psp/pagarme.adapter";
import { MercadoPagoAdapter } from "./psp/mercadopago.adapter";
import { TransactionRepository } from "./modules/transactions/transaction.repository";
import { TransactionService } from "./modules/transactions/transaction.service";
import { SyncService } from "./modules/sync/sync.service";
import { TransactionController } from "./modules/transactions/transaction.controller";
import { SyncController } from "./modules/sync/sync.controller";
import { transactionRoutes } from "./modules/transactions/transaction.routes";
import { syncRoutes } from "./modules/sync/sync.routes";

async function bootstrap() {
  await runMigrations();

  const pagarmeHttp = new AxiosHttpClient(
    process.env.PAGARME_BASE_URL!,
    {
      Authorization: `Basic ${Buffer.from(`${process.env.PAGARME_API_KEY}:`).toString("base64")}`,
    }
  );

  const mercadoPagoHttp = new AxiosHttpClient(
    process.env.MERCADOPAGO_BASE_URL!,
    {
      Authorization: `Bearer ${process.env.MERCADOPAGO_ACCESS_TOKEN}`,
    }
  );

  const adapters = [
    new PagarmeAdapter(pagarmeHttp),
    new MercadoPagoAdapter(mercadoPagoHttp),
  ];

  const repository = new TransactionRepository();

  const transactionService = new TransactionService(repository);
  const syncService = new SyncService(adapters, repository);

  const transactionController = new TransactionController(transactionService);
  const syncController = new SyncController(syncService);

  const app = express();
  app.use(express.json());

  app.use("/api", transactionRoutes(transactionController));
  app.use("/api", syncRoutes(syncController));

  app.get("/health", (_, res) => res.json({ status: "ok" }));

  app.use((_, res) => {
    res.status(404).json({ success: false, status: 404, error: { code: "E_NOT_FOUND", message: "Rota não encontrada" } });
  });

  const PORT = process.env.PORT ?? 3000;
  app.listen(PORT, () => {
    logger.info(`Servidor rodando na porta ${PORT}`);
  });
}

bootstrap().catch((err) => {
  logger.error("Erro ao iniciar servidor", { error: err.message });
  process.exit(1);
});