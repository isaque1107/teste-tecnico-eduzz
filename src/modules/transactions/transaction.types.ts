export interface Payer {
  id: number;
  externalId: string;
  psp: string;
  name: string;
  email: string;
  documentHash: string;
  documentType: "cpf" | "cnpj";
  createdAt: Date;
}

export interface Transaction {
  id: number;
  externalId: string;
  psp: string;
  payerId: number;
  status: string;
  originalAmount: number;
  netAmount: number;
  fees: number;
  installmentCount: number;
  currency: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Installment {
  id: number;
  transactionId: number;
  installmentNumber: number;
  amount: number;
  fees: number;
  status: string;
  dueDate: Date | null;
  paidAt: Date | null;
}

export interface TransactionFilters {
  startDate?: string;
  endDate?: string;
  status?: string;
  psp?: string;
  payerDocument?: string;
  page: number;
  limit: number;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}