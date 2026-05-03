import { Queue } from "bullmq";
import { Redis } from "ioredis";

export const SYNC_QUEUE_NAME = "sync";
export const SYNC_JOB_NAME = "sync-all";

export class SyncQueue {
  private readonly queue: Queue;

  constructor(connection: Redis) {
    this.queue = new Queue(SYNC_QUEUE_NAME, {
      connection,
      defaultJobOptions: {
        attempts: 3,
        backoff: { type: "exponential", delay: 5000 },
        removeOnComplete: 100,
        removeOnFail: 500,
      },
    });
  }

  async enqueueSync(): Promise<string> {
    const job = await this.queue.add(SYNC_JOB_NAME, {});
    return job.id!;
  }

  async close(): Promise<void> {
    await this.queue.close();
  }
}
