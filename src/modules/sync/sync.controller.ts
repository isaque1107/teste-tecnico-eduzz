import { Request, Response } from "express";
import { SyncQueue } from "./sync.queue";
import { BaseController } from "../../shared/controller";

export class SyncController extends BaseController {
  constructor(private readonly syncQueue: SyncQueue) {
    super();
  }

  async sync(req: Request, res: Response): Promise<void> {
    try {
      const jobId = await this.syncQueue.enqueueSync();
      res.status(202).json({
        success: true,
        message: "Sincronização enfileirada",
        jobId,
      });
    } catch (error) {
      this.sendError(res, error);
    }
  }
}
