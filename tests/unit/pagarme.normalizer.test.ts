import { normalizePagarme } from "../../src/psp/normalizers/pagarme.normalizer";

const makeOrder = (overrides = {}) => ({
  id: "or_001",
  amount: 10000,
  currency: "BRL",
  status: "paid",
  created_at: "2024-01-15T10:30:00Z",
  updated_at: "2024-01-15T10:31:00Z",
  customer: {
    id: "cus_001",
    name: "Maria Silva",
    email: "maria@example.com",
    document: "12345678901",
    document_type: "CPF",
  },
  charges: [{
    id: "ch_001",
    amount: 10000,
    paid_amount: 9700,
    status: "paid",
    payment_method: "credit_card",
    last_transaction: {
      id: "tran_001",
      installments: 3,
      status: "paid",
      updated_at: "2024-01-15T10:31:00Z",
    },
  }],
  ...overrides,
});

describe("normalizePagarme", () => {
  it("deve normalizar um pedido válido", () => {
    const result = normalizePagarme(makeOrder());

    expect(result).not.toBeNull();
    expect(result?.externalId).toBe("or_001");
    expect(result?.psp).toBe("pagarme");
    expect(result?.originalAmount).toBe(10000);
    expect(result?.netAmount).toBe(9700);
    expect(result?.fees).toBe(300);
    expect(result?.installmentCount).toBe(3);
    expect(result?.installments).toHaveLength(3);
  });

  it("deve retornar null se não houver cobrança de cartão de crédito", () => {
    const order = makeOrder({
      charges: [{
        payment_method: "boleto",
        amount: 10000,
        paid_amount: 10000,
        status: "paid",
        last_transaction: { installments: 1, status: "paid" },
      }],
    });

    expect(normalizePagarme(order)).toBeNull();
  });

  it("deve retornar null se o cliente não tiver documento", () => {
    const order = makeOrder({
      customer: { id: "cus_001", name: "Maria", email: "maria@example.com", document: null, document_type: "CPF" },
    });

    expect(normalizePagarme(order)).toBeNull();
  });

  it("deve normalizar os dados do pagador corretamente", () => {
    const result = normalizePagarme(makeOrder());

    expect(result?.payer.externalId).toBe("cus_001");
    expect(result?.payer.document).toBe("12345678901");
    expect(result?.payer.documentType).toBe("cpf");
  });
});