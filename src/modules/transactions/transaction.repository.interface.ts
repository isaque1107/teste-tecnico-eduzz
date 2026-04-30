import { NormalizedTransaction } from "../../psp/psp.adapter.interface";
import { Installment, Payer, PaginatedResult, Transaction, TransactionFilters } from "./transaction.types";

export interface ITransactionRepository {
  upsertPayer(data: NormalizedTransaction["payer"], psp: string): Promise<number>;
  upsertTransaction(data: NormalizedTransaction, payerId: number): Promise<number>;
  upsertInstallments(transactionId: number, installments: NormalizedTransaction["installments"]): Promise<void>;
  findAll(filters: TransactionFilters): Promise<PaginatedResult<Transaction>>;
  findById(id: number): Promise<Transaction | null>;
  findInstallmentsByTransactionId(transactionId: number): Promise<Installment[]>;
  findInstallmentById(transactionId: number, installmentId: number): Promise<Installment | null>;
  findPayerByTransactionId(transactionId: number): Promise<Payer | null>;
}