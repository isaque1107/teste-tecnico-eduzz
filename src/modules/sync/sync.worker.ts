import { Worker } from "bullmq";
import { Redis } from "ioredis";
import { SyncService } from "./sync.service";
import { SYNC_QUEUE_NAME } from "./sync.queue";
import { logger } from "../../shared/logger";

export function createSyncWorker(connection: Redis, syncService: SyncService): Worker {
  const worker = new Worker(
    SYNC_QUEUE_NAME,
    async () => {
      await syncService.syncAll();
    },
    { connection }
  );

  worker.on("completed", (job) => {
    logger.info("Job de sincronização concluído", { jobId: job.id });
  });

  worker.on("failed", (job, err) => {
    logger.error("Job de sincronização falhou", {
      jobId: job?.id,
      error: err.message,
    });
  });

  return worker;
}
