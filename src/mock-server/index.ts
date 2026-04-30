import express from "express";

const app = express();

const pagarmeOrders = [
  {
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
  },
  {
    id: "or_002",
    amount: 5000,
    currency: "BRL",
    status: "paid",
    created_at: "2024-01-16T10:30:00Z",
    updated_at: "2024-01-16T10:31:00Z",
    customer: {
      id: "cus_002",
      name: "João Santos",
      email: "joao@example.com",
      document: "98765432100",
      document_type: "CPF",
    },
    charges: [{
      id: "ch_002",
      amount: 5000,
      paid_amount: 4850,
      status: "paid",
      payment_method: "credit_card",
      last_transaction: {
        id: "tran_002",
        installments: 1,
        status: "paid",
        updated_at: "2024-01-16T10:31:00Z",
      },
    }],
  },
];

const mercadoPagoPayments = [
  {
    id: 123456789,
    date_created: "2024-01-15T10:30:00.000-03:00",
    date_approved: "2024-01-15T10:31:00.000-03:00",
    date_last_updated: "2024-01-15T10:31:00.000-03:00",
    payment_type_id: "credit_card",
    status: "approved",
    currency_id: "BRL",
    transaction_amount: 100.00,
    net_received_amount: 97.00,
    total_paid_amount: 100.00,
    installments: 2,
    fee_details: [{ type: "mercadopago_fee", amount: 3.00, fee_payer: "collector" }],
    payer: {
      id: "987654321",
      email: "joao@example.com",
      first_name: "João",
      last_name: "Souza",
      identification: { type: "CPF", number: "98765432100" },
    },
  },
  {
    id: 987654321,
    date_created: "2024-01-16T10:30:00.000-03:00",
    date_approved: "2024-01-16T10:31:00.000-03:00",
    date_last_updated: "2024-01-16T10:31:00.000-03:00",
    payment_type_id: "credit_card",
    status: "approved",
    currency_id: "BRL",
    transaction_amount: 200.00,
    net_received_amount: 194.00,
    total_paid_amount: 200.00,
    installments: 1,
    fee_details: [{ type: "mercadopago_fee", amount: 6.00, fee_payer: "collector" }],
    payer: {
      id: "123456789",
      email: "maria@example.com",
      first_name: "Maria",
      last_name: "Silva",
      identification: { type: "CPF", number: "12345678901" },
    },
  },
];

// mock do pagarme
app.get("/pagarme/core/v5/orders", (req, res) => {
  res.json({ data: pagarmeOrders, paging: { total: pagarmeOrders.length, has_more: false } });
});

app.get("/pagarme/core/v5/orders/:id", (req, res) => {
  const order = pagarmeOrders.find((o) => o.id === req.params.id);
  if (!order) return res.status(404).json({ message: "Pedido não encontrado" });
  res.json(order);
});

// mock do mercado pago
app.get("/mercadopago/v1/payments/search", (req, res) => {
  res.json({ paging: { total: mercadoPagoPayments.length, limit: 20, offset: 0 }, results: mercadoPagoPayments });
});

app.get("/mercadopago/v1/payments/:id", (req, res) => {
  const payment = mercadoPagoPayments.find((p) => p.id === Number(req.params.id));
  if (!payment) return res.status(404).json({ message: "Pagamento não encontrado" });
  res.json(payment);
});

app.listen(4000, () => console.log("Mock server rodando na porta 4000"));