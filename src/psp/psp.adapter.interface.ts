export interface NormalizedPayer {
  externalId: string;
  name: string;
  email: string;
  document: string;
  documentType: "cpf" | "cnpj";
}

export interface NormalizedInstallment {
  installmentNumber: number;
  amount: number;
  fees: number;
  status: string;
  dueDate: string | null;
  paidAt: string | null;
}

export interface NormalizedTransaction {
  externalId: string;
  psp: string;
  status: string;
  originalAmount: number;
  netAmount: number;
  fees: number;
  installmentCount: number;
  currency: string;
  createdAt: string;
  updatedAt: string;
  payer: NormalizedPayer;
  installments: NormalizedInstallment[];
}

export interface PspPage {
  transactions: NormalizedTransaction[];
  hasMore: boolean;
}

export interface IPspAdapter {
  readonly pspName: string;
  fetchPage(page: number): Promise<PspPage>;
  fetchById(externalId: string): Promise<NormalizedTransaction | null>;
}