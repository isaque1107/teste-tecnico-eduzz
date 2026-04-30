import { ITransactionRepository } from "./transaction.repository.interface";
import { TransactionFilters } from "./transaction.types";
import { NotFoundError, ValidationError } from "../../shared/errors";
import { ITransactionService } from "./transaction.service.interface";

export class TransactionService implements ITransactionService {
  constructor(private readonly repository: ITransactionRepository) {}

  async listTransactions(query: any) {
    const page = Number(query.page ?? 1);
    const limit = Math.min(Number(query.limit ?? 20), 100);

    if (page < 1) throw new ValidationError("Página inválida");
    if (limit < 1) throw new ValidationError("Limite inválido");

    const filters: TransactionFilters = {
      page,
      limit,
      startDate: query.startDate,
      endDate: query.endDate,
      status: query.status,
      psp: query.psp,
      payerDocument: query.payerDocument,
    };

    return this.repository.findAll(filters);
  }

  async getTransaction(id: number) {
    const transaction = await this.repository.findById(id);
    if (!transaction) throw new NotFoundError("Transação");

    const payer = await this.repository.findPayerByTransactionId(id);
    const installments = await this.repository.findInstallmentsByTransactionId(id);

    return { ...transaction, payer: this.sanitizePayer(payer), installments };
  }

  async getInstallments(transactionId: number) {
    const transaction = await this.repository.findById(transactionId);
    if (!transaction) throw new NotFoundError("Transação");

    return this.repository.findInstallmentsByTransactionId(transactionId);
  }

  async getInstallment(transactionId: number, installmentId: number) {
    const transaction = await this.repository.findById(transactionId);
    if (!transaction) throw new NotFoundError("Transação");

    const installment = await this.repository.findInstallmentById(transactionId, installmentId);
    if (!installment) throw new NotFoundError("Parcela");

    return installment;
  }

  async getPayer(transactionId: number) {
    const transaction = await this.repository.findById(transactionId);
    if (!transaction) throw new NotFoundError("Transação");

    const payer = await this.repository.findPayerByTransactionId(transactionId);
    if (!payer) throw new NotFoundError("Pagador");

    return this.sanitizePayer(payer);
  }

  private sanitizePayer(payer: any) {
    if (!payer) return null;
    const { document_hash, ...rest } = payer;
    return { ...rest, hasDocument: !!document_hash };
  }
}