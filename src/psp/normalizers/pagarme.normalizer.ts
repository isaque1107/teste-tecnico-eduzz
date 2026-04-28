import { NormalizedTransaction, NormalizedInstallment } from "../psp.adapter.interface";
import { logger } from "../../shared/logger";

export function normalizePagarme(item: any): NormalizedTransaction | null {
  const charge = item.charges?.find((c: any) => c.payment_method === "credit_card");
  if (!charge || !item.customer?.document) return null;

  const installmentCount = charge.last_transaction?.installments ?? 1;
  const installments = buildInstallments(charge, installmentCount);

  if (installments.length !== installmentCount) {
    logger.warn("Transação rejeitada: parcelas incompletas", { externalId: item.id });
    return null;
  }

  const originalAmount = charge.amount ?? 0;
  const netAmount = charge.paid_amount ?? 0;

  return {
    externalId: item.id,
    psp: "pagarme",
    status: charge.last_transaction?.status ?? item.status,
    originalAmount,
    netAmount,
    fees: originalAmount - netAmount,
    installmentCount,
    currency: item.currency ?? "BRL",
    createdAt: item.created_at,
    updatedAt: item.updated_at,
    payer: {
      externalId: item.customer.id,
      name: item.customer.name,
      email: item.customer.email,
      document: item.customer.document,
      documentType: item.customer.document_type?.toLowerCase() === "cnpj" ? "cnpj" : "cpf",
    },
    installments,
  };
}

function buildInstallments(charge: any, count: number): NormalizedInstallment[] {
  const perInstallment = Math.floor(charge.amount / count);
  const fees = Math.floor((charge.amount - charge.paid_amount) / count);
  const paidAt = charge.status === "paid" ? (charge.last_transaction?.updated_at ?? null) : null;

  return Array.from({ length: count }, (_, i) => ({
    installmentNumber: i + 1,
    amount: perInstallment,
    fees,
    status: charge.status,
    dueDate: null,
    paidAt,
  }));
}