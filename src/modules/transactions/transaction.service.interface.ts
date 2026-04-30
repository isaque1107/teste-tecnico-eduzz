import { PaginatedResult, Transaction, Installment, Payer } from "./transaction.types";

export interface ITransactionService {
  listTransactions(query: any): Promise<PaginatedResult<Transaction>>;
  getTransaction(id: number): Promise<Transaction & { payer: any; installments: Installment[] }>;
  getInstallments(transactionId: number): Promise<Installment[]>;
  getInstallment(transactionId: number, installmentId: number): Promise<Installment>;
  getPayer(transactionId: number): Promise<Omit<Payer, "documentHash"> & { hasDocument: boolean }>;
}