import { SyncService } from "../../src/modules/sync/sync.service";
import { ITransactionRepository } from "../../src/modules/transactions/transaction.repository.interface";
import { IPspAdapter } from "../../src/psp/psp.adapter.interface";

const makeMockAdapter = (transactions = [makeTransaction()]): IPspAdapter => ({
  pspName: "pagarme",
  fetchPage: jest.fn().mockResolvedValueOnce({ transactions, hasMore: false }),
  fetchById: jest.fn(),
});

const makeMockRepository = (): jest.Mocked<ITransactionRepository> => ({
  upsertPayer: jest.fn().mockResolvedValue(1),
  upsertTransaction: jest.fn().mockResolvedValue(1),
  upsertInstallments: jest.fn().mockResolvedValue(undefined),
  findAll: jest.fn(),
  findById: jest.fn(),
  findInstallmentsByTransactionId: jest.fn(),
  findInstallmentById: jest.fn(),
  findPayerByTransactionId: jest.fn(),
});

function makeTransaction() {
  return {
    externalId: "or_001",
    psp: "pagarme",
    status: "paid",
    originalAmount: 10000,
    netAmount: 9700,
    fees: 300,
    installmentCount: 1,
    currency: "BRL",
    createdAt: "2024-01-15T10:30:00Z",
    updatedAt: "2024-01-15T10:31:00Z",
    payer: {
      externalId: "cus_001",
      name: "Maria Silva",
      email: "maria@example.com",
      document: "12345678901",
      documentType: "cpf" as const,
    },
    installments: [{
      installmentNumber: 1,
      amount: 10000,
      fees: 300,
      status: "paid",
      dueDate: null,
      paidAt: null,
    }],
  };
}

describe("SyncService", () => {
  it("deve sincronizar transações com sucesso", async () => {
    const repository = makeMockRepository();
    const adapter = makeMockAdapter();
    const service = new SyncService([adapter], repository);

    await service.syncAll();

    expect(repository.upsertPayer).toHaveBeenCalledTimes(1);
    expect(repository.upsertTransaction).toHaveBeenCalledTimes(1);
    expect(repository.upsertInstallments).toHaveBeenCalledTimes(1);
  });

  it("não deve interromper sync se uma transação falhar", async () => {
    const repository = makeMockRepository();
    repository.upsertPayer
      .mockRejectedValueOnce(new Error("Erro banco"))
      .mockResolvedValue(1);

    const adapter = makeMockAdapter([makeTransaction(), makeTransaction()]);
    const service = new SyncService([adapter], repository);

    await expect(service.syncAll()).resolves.not.toThrow();
    expect(repository.upsertPayer).toHaveBeenCalledTimes(2);
  });

  it("deve processar múltiplos adapters", async () => {
    const repository = makeMockRepository();
    const adapter1 = makeMockAdapter();
    const adapter2 = { ...makeMockAdapter(), pspName: "mercadopago" };
    const service = new SyncService([adapter1, adapter2], repository);

    await service.syncAll();

    expect(repository.upsertTransaction).toHaveBeenCalledTimes(2);
  });
});