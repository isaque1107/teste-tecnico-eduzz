import "dotenv/config";
import { logger } from "./shared/logger";
import { AxiosHttpClient } from "./infra/axios.http.client";
import { PagarmeAdapter } from "./psp/pagarme.adapter";
import { MercadoPagoAdapter } from "./psp/mercadopago.adapter";
import { TransactionRepository } from "./modules/transactions/transaction.repository";
import { SyncService } from "./modules/sync/sync.service";
import { createRedisConnection } from "./infra/queue/redis.connection";
import { createSyncWorker } from "./modules/sync/sync.worker";

async function bootstrap() {
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
  const syncService = new SyncService(adapters, repository);

  const connection = createRedisConnection();
  const worker = createSyncWorker(connection, syncService);

  logger.info("Worker de sincronização iniciado");

  const shutdown = async () => {
    logger.info("Encerrando worker");
    await worker.close();
    await connection.quit();
    process.exit(0);
  };

  process.on("SIGTERM", shutdown);
  process.on("SIGINT", shutdown);
}

bootstrap().catch((err) => {
  logger.error("Erro ao iniciar worker", { error: err.message });
  process.exit(1);
});
