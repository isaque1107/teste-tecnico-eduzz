import { NormalizedTransaction, NormalizedInstallment } from "../psp.adapter.interface";
import { logger } from "../../shared/logger";

const STATUS_MAP: Record<string, string> = {
  approved: "paid",
  rejected: "canceled",
  refunded: "refunded",
  pending: "pending",
  in_process: "pending",
  cancelled: "canceled",
};

export function normalizeMercadoPago(item: any): NormalizedTransaction | null {
  if (item.payment_type_id !== "credit_card") return null;

  if (!item.payer?.identification?.number) {
    logger.warn("Transação rejeitada: pagador sem documento", { externalId: item.id });
    return null;
  }

  const installmentCount = item.installments ?? 1;
  const installments = buildInstallments(item, installmentCount);

  if (installments.length !== installmentCount) {
    logger.warn("Transação rejeitada: parcelas incompletas", { externalId: item.id });
    return null;
  }

  const originalAmount = Math.round(item.transaction_amount * 100);
  const netAmount = Math.round(item.net_received_amount * 100);
  const status = STATUS_MAP[item.status] ?? item.status;

  return {
    externalId: String(item.id),
    psp: "mercadopago",
    status,
    originalAmount,
    netAmount,
    fees: originalAmount - netAmount,
    installmentCount,
    currency: item.currency_id ?? "BRL",
    createdAt: item.date_created,
    updatedAt: item.date_last_updated,
    payer: {
      externalId: String(item.payer.id),
      name: `${item.payer.first_name} ${item.payer.last_name}`.trim(),
      email: item.payer.email,
      document: item.payer.identification.number,
      documentType: item.payer.identification.type?.toLowerCase() === "cnpj" ? "cnpj" : "cpf",
    },
    installments,
  };
}

function buildInstallments(item: any, count: number): NormalizedInstallment[] {
  const totalAmount = Math.round(item.transaction_amount * 100);
  const totalFees = Math.round(
    (item.fee_details ?? []).reduce((acc: number, f: any) => acc + f.amount, 0) * 100
  );

  return Array.from({ length: count }, (_, i) => ({
    installmentNumber: i + 1,
    amount: Math.floor(totalAmount / count),
    fees: Math.floor(totalFees / count),
    status: STATUS_MAP[item.status] ?? item.status,
    dueDate: null,
    paidAt: item.date_approved ?? null,
  }));
}