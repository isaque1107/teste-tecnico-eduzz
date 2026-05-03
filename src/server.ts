import "dotenv/config";
import express from "express";
import { runMigrations } from "./database/migrate";
import { logger } from "./shared/logger";
import { TransactionRepository } from "./modules/transactions/transaction.repository";
import { TransactionService } from "./modules/transactions/transaction.service";
import { TransactionController } from "./modules/transactions/transaction.controller";
import { SyncController } from "./modules/sync/sync.controller";
import { SyncQueue } from "./modules/sync/sync.queue";
import { transactionRoutes } from "./modules/transactions/transaction.routes";
import { syncRoutes } from "./modules/sync/sync.routes";
import { createRedisConnection } from "./infra/queue/redis.connection";
import { docsRoutes } from "./docs/docs.routes";

async function bootstrap() {
  await runMigrations();

  const repository = new TransactionRepository();
  const transactionService = new TransactionService(repository);
  const transactionController = new TransactionController(transactionService);

  const redis = createRedisConnection();
  const syncQueue = new SyncQueue(redis);
  const syncController = new SyncController(syncQueue);

  const app = express();
  app.use(express.json());

  app.use("/api", transactionRoutes(transactionController));
  app.use("/api", syncRoutes(syncController));
  app.use(docsRoutes());

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
