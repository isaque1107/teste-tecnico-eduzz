import { TransactionService } from "../../src/modules/transactions/transaction.service";
import { ITransactionRepository } from "../../src/modules/transactions/transaction.repository.interface";
import { NotFoundError } from "../../src/shared/errors";

const makeMockRepository = (): jest.Mocked<ITransactionRepository> => ({
  upsertPayer: jest.fn(),
  upsertTransaction: jest.fn(),
  upsertInstallments: jest.fn(),
  findAll: jest.fn().mockResolvedValue({ data: [], total: 0, page: 1, limit: 20, totalPages: 0 }),
  findById: jest.fn().mockResolvedValue(null),
  findInstallmentsByTransactionId: jest.fn().mockResolvedValue([]),
  findInstallmentById: jest.fn().mockResolvedValue(null),
  findPayerByTransactionId: jest.fn().mockResolvedValue(null),
});

describe("TransactionService", () => {
  it("deve lançar NotFoundError se transação não existir", async () => {
    const repository = makeMockRepository();
    const service = new TransactionService(repository);

    await expect(service.getTransaction(999)).rejects.toThrow(NotFoundError);
  });

  it("deve lançar NotFoundError se parcela não existir", async () => {
    const repository = makeMockRepository();
    repository.findById.mockResolvedValue({ id: 1 } as any);
    const service = new TransactionService(repository);

    await expect(service.getInstallment(1, 999)).rejects.toThrow(NotFoundError);
  });

  it("deve lançar NotFoundError se pagador não existir", async () => {
    const repository = makeMockRepository();
    repository.findById.mockResolvedValue({ id: 1 } as any);
    const service = new TransactionService(repository);

    await expect(service.getPayer(1)).rejects.toThrow(NotFoundError);
  });

  it("não deve retornar document_hash na resposta do pagador", async () => {
    const repository = makeMockRepository();
    repository.findById.mockResolvedValue({ id: 1 } as any);
    repository.findPayerByTransactionId.mockResolvedValue({
      id: 1, externalId: "cus_001", psp: "pagarme",
      name: "Maria", email: "maria@example.com",
      document_hash: "abc123", documentType: "cpf",
      createdAt: new Date(),
    } as any);

    const service = new TransactionService(repository);
    const payer = await service.getPayer(1);

    expect(payer).not.toHaveProperty("document_hash");
    expect(payer).toHaveProperty("hasDocument", true);
  });

  it("deve respeitar o limite máximo de 100 por página", async () => {
    const repository = makeMockRepository();
    const service = new TransactionService(repository);

    await service.listTransactions({ page: 1, limit: 999 });

    expect(repository.findAll).toHaveBeenCalledWith(
      expect.objectContaining({ limit: 100 })
    );
  });
});