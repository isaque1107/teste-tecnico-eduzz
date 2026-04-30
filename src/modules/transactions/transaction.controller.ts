import { Request, Response } from "express";
import { TransactionService } from "./transaction.service";
import { BaseController } from "../../shared/controller";

export class TransactionController extends BaseController {
  constructor(private readonly service: TransactionService) {
    super();
  }

  async index(req: Request, res: Response): Promise<void> {
    try {
      const result = await this.service.listTransactions(req.query);
      this.send(res, 200, result);
    } catch (error) {
      this.sendError(res, error);
    }
  }

  async show(req: Request, res: Response): Promise<void> {
    try {
      const result = await this.service.getTransaction(Number(req.params.id));
      this.send(res, 200, result);
    } catch (error) {
      this.sendError(res, error);
    }
  }

  async installments(req: Request, res: Response): Promise<void> {
    try {
      const result = await this.service.getInstallments(Number(req.params.transactionId));
      this.send(res, 200, result);
    } catch (error) {
      this.sendError(res, error);
    }
  }

  async installment(req: Request, res: Response): Promise<void> {
    try {
      const result = await this.service.getInstallment(
        Number(req.params.transactionId),
        Number(req.params.installmentId)
      );
      this.send(res, 200, result);
    } catch (error) {
      this.sendError(res, error);
    }
  }

  async payer(req: Request, res: Response): Promise<void> {
    try {
      const result = await this.service.getPayer(Number(req.params.transactionId));
      this.send(res, 200, result);
    } catch (error) {
      this.sendError(res, error);
    }
  }
}