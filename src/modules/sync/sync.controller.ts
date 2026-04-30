import { Request, Response } from "express";
import { SyncService } from "./sync.service";
import { BaseController } from "../../shared/controller";

export class SyncController extends BaseController {
  constructor(private readonly syncService: SyncService) {
    super();
  }

  async sync(req: Request, res: Response): Promise<void> {
    try {
      res.status(202).json({ success: true, message: "Sincronização iniciada" });
      await this.syncService.syncAll();
    } catch (error) {
      this.sendError(res, error);
    }
  }
}