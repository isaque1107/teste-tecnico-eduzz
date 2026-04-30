import { pool } from "../../database/connection";
import { Installment, Payer, PaginatedResult, Transaction, TransactionFilters } from "./transaction.types";
import { NormalizedTransaction } from "../../psp/psp.adapter.interface";
import { hashDocument } from "../../shared/hash";
import { ITransactionRepository } from "./transaction.repository.interface";

export class TransactionRepository implements ITransactionRepository {
  async upsertPayer(data: NormalizedTransaction["payer"], psp: string): Promise<number> {
    const documentHash = hashDocument(data.document);

    await pool.execute(
      `INSERT INTO payers (external_id, psp, name, email, document_hash, document_type)
       VALUES (?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE name = VALUES(name), email = VALUES(email)`,
      [data.externalId, psp, data.name, data.email, documentHash, data.documentType]
    );

    const [rows] = await pool.execute<any[]>(
      `SELECT id FROM payers WHERE external_id = ? AND psp = ?`,
      [data.externalId, psp]
    );

    return rows[0].id;
  }

  async upsertTransaction(data: NormalizedTransaction, payerId: number): Promise<number> {
    await pool.execute(
      `INSERT INTO transactions
         (external_id, psp, payer_id, status, original_amount, net_amount, fees, installment_count, currency, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         status = VALUES(status),
         updated_at = VALUES(updated_at)`,
      [
        data.externalId, data.psp, payerId, data.status,
        data.originalAmount, data.netAmount, data.fees,
        data.installmentCount, data.currency,
        new Date(data.createdAt), new Date(data.updatedAt),
      ]
    );

    const [rows] = await pool.execute<any[]>(
      `SELECT id FROM transactions WHERE external_id = ? AND psp = ?`,
      [data.externalId, data.psp]
    );

    return rows[0].id;
  }

  async upsertInstallments(transactionId: number, installments: NormalizedTransaction["installments"]): Promise<void> {
    for (const inst of installments) {
      await pool.execute(
        `INSERT INTO installments
           (transaction_id, installment_number, amount, fees, status, due_date, paid_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
           status = VALUES(status),
           paid_at = VALUES(paid_at)`,
        [
          transactionId, inst.installmentNumber, inst.amount,
          inst.fees, inst.status,
          inst.dueDate ? new Date(inst.dueDate) : null,
          inst.paidAt ? new Date(inst.paidAt) : null,
        ]
      );
    }
  }

  async findAll(filters: TransactionFilters): Promise<PaginatedResult<Transaction>> {
    const conditions: string[] = [];
    const params: any[] = [];

    if (filters.startDate) {
      conditions.push("t.created_at >= ?");
      params.push(new Date(filters.startDate));
    }

    if (filters.endDate) {
      conditions.push("t.created_at <= ?");
      params.push(new Date(filters.endDate));
    }

    if (filters.status) {
      conditions.push("t.status = ?");
      params.push(filters.status);
    }

    if (filters.psp) {
      conditions.push("t.psp = ?");
      params.push(filters.psp);
    }

    if (filters.payerDocument) {
      conditions.push("p.document_hash = ?");
      params.push(filters.payerDocument);
    }

    const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
    const limit = Math.max(1, Math.floor(Number(filters.limit)));
    const page = Math.max(1, Math.floor(Number(filters.page)));
    const offset = (page - 1) * limit;

    const [countRows] = await pool.execute<any[]>(
      `SELECT COUNT(*) as total FROM transactions t
       LEFT JOIN payers p ON p.id = t.payer_id ${where}`,
      params
    );

    const total = countRows[0].total;

    const [rows] = await pool.query<any[]>(
      `SELECT t.* FROM transactions t
       LEFT JOIN payers p ON p.id = t.payer_id
       ${where} ORDER BY t.created_at DESC LIMIT ${limit} OFFSET ${offset}`,
      params
    );

    return {
      data: rows,
      total,
      page: filters.page,
      limit: filters.limit,
      totalPages: Math.ceil(total / filters.limit),
    };
  }

  async findById(id: number): Promise<Transaction | null> {
    const [rows] = await pool.execute<any[]>(
      `SELECT * FROM transactions WHERE id = ?`, [id]
    );
    return rows[0] ?? null;
  }

  async findInstallmentsByTransactionId(transactionId: number): Promise<Installment[]> {
    const [rows] = await pool.execute<any[]>(
      `SELECT * FROM installments WHERE transaction_id = ? ORDER BY installment_number`,
      [transactionId]
    );
    return rows;
  }

  async findInstallmentById(transactionId: number, installmentId: number): Promise<Installment | null> {
    const [rows] = await pool.execute<any[]>(
      `SELECT * FROM installments WHERE transaction_id = ? AND id = ?`,
      [transactionId, installmentId]
    );
    return rows[0] ?? null;
  }

  async findPayerByTransactionId(transactionId: number): Promise<Payer | null> {
    const [rows] = await pool.execute<any[]>(
      `SELECT p.* FROM payers p
       INNER JOIN transactions t ON t.payer_id = p.id
       WHERE t.id = ?`,
      [transactionId]
    );
    return rows[0] ?? null;
  }
}