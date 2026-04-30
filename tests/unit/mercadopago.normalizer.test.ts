import { normalizeMercadoPago } from "../../src/psp/normalizers/mercadopago.normalizer";

const makePayment = (overrides = {}) => ({
  id: 123456789,
  date_created: "2024-01-15T10:30:00.000-03:00",
  date_approved: "2024-01-15T10:31:00.000-03:00",
  date_last_updated: "2024-01-15T10:31:00.000-03:00",
  payment_type_id: "credit_card",
  status: "approved",
  currency_id: "BRL",
  transaction_amount: 100.00,
  net_received_amount: 97.00,
  installments: 2,
  fee_details: [{ type: "mercadopago_fee", amount: 3.00, fee_payer: "collector" }],
  payer: {
    id: "987654321",
    email: "joao@example.com",
    first_name: "João",
    last_name: "Souza",
    identification: { type: "CPF", number: "98765432100" },
  },
  ...overrides,
});

describe("normalizeMercadoPago", () => {
  it("deve normalizar um pagamento válido", () => {
    const result = normalizeMercadoPago(makePayment());

    expect(result).not.toBeNull();
    expect(result?.externalId).toBe("123456789");
    expect(result?.psp).toBe("mercadopago");
    expect(result?.originalAmount).toBe(10000);
    expect(result?.netAmount).toBe(9700);
    expect(result?.fees).toBe(300);
    expect(result?.installmentCount).toBe(2);
    expect(result?.installments).toHaveLength(2);
  });

  it("deve retornar null se não for cartão de crédito", () => {
    const payment = makePayment({ payment_type_id: "pix" });
    expect(normalizeMercadoPago(payment)).toBeNull();
  });

  it("deve retornar null se o pagador não tiver documento", () => {
    const payment = makePayment({
      payer: { id: "123", email: "a@a.com", first_name: "A", last_name: "B", identification: { type: "CPF", number: null } },
    });
    expect(normalizeMercadoPago(payment)).toBeNull();
  });

  it("deve mapear status approved para paid", () => {
    const result = normalizeMercadoPago(makePayment({ status: "approved" }));
    expect(result?.status).toBe("paid");
  });

  it("deve mapear status rejected para canceled", () => {
    const result = normalizeMercadoPago(makePayment({ status: "rejected" }));
    expect(result?.status).toBe("canceled");
  });
});