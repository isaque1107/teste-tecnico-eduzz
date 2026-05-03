export const openApiSpec = {
  openapi: "3.0.3",
  info: {
    title: "PSP Aggregator API",
    description: "API para agregar transações de múltiplos PSPs (Pagar.me e Mercado Pago).",
    version: "1.0.0",
  },
  servers: [
    { url: "http://localhost:3000", description: "Local" },
  ],
  tags: [
    { name: "Transactions", description: "Consulta de transações, parcelas e pagadores" },
    { name: "Sync", description: "Sincronização de transações dos PSPs" },
    { name: "Health", description: "Healthcheck" },
  ],
  paths: {
    "/health": {
      get: {
        tags: ["Health"],
        summary: "Healthcheck",
        responses: {
          "200": {
            description: "Servidor saudável",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: { status: { type: "string", example: "ok" } },
                },
              },
            },
          },
        },
      },
    },
    "/api/sync": {
      post: {
        tags: ["Sync"],
        summary: "Enfileira sincronização de transações",
        description: "Cria um job na fila BullMQ para sincronizar transações de todos os PSPs.",
        responses: {
          "202": {
            description: "Sincronização enfileirada",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    message: { type: "string", example: "Sincronização enfileirada" },
                    jobId: { type: "string", example: "1" },
                  },
                },
              },
            },
          },
          "500": { $ref: "#/components/responses/InternalError" },
        },
      },
    },
    "/api/transactions": {
      get: {
        tags: ["Transactions"],
        summary: "Lista transações com filtros e paginação",
        parameters: [
          { name: "page", in: "query", schema: { type: "integer", minimum: 1, default: 1 } },
          { name: "limit", in: "query", schema: { type: "integer", minimum: 1, maximum: 100, default: 20 } },
          { name: "startDate", in: "query", schema: { type: "string", format: "date" } },
          { name: "endDate", in: "query", schema: { type: "string", format: "date" } },
          { name: "status", in: "query", schema: { type: "string" } },
          { name: "psp", in: "query", schema: { type: "string", enum: ["pagarme", "mercadopago"] } },
          { name: "payerDocument", in: "query", schema: { type: "string" } },
        ],
        responses: {
          "200": {
            description: "Lista paginada de transações",
            content: {
              "application/json": {
                schema: {
                  allOf: [
                    { $ref: "#/components/schemas/SuccessEnvelope" },
                    {
                      type: "object",
                      properties: {
                        data: { $ref: "#/components/schemas/PaginatedTransactions" },
                      },
                    },
                  ],
                },
              },
            },
          },
          "400": { $ref: "#/components/responses/ValidationError" },
        },
      },
    },
    "/api/transactions/{id}": {
      get: {
        tags: ["Transactions"],
        summary: "Detalha uma transação com pagador e parcelas",
        parameters: [{ $ref: "#/components/parameters/TransactionId" }],
        responses: {
          "200": {
            description: "Transação encontrada",
            content: {
              "application/json": {
                schema: {
                  allOf: [
                    { $ref: "#/components/schemas/SuccessEnvelope" },
                    {
                      type: "object",
                      properties: { data: { $ref: "#/components/schemas/TransactionWithRelations" } },
                    },
                  ],
                },
              },
            },
          },
          "404": { $ref: "#/components/responses/NotFound" },
        },
      },
    },
    "/api/transactions/{transactionId}/installments": {
      get: {
        tags: ["Transactions"],
        summary: "Lista parcelas de uma transação",
        parameters: [{ $ref: "#/components/parameters/TransactionIdPath" }],
        responses: {
          "200": {
            description: "Parcelas da transação",
            content: {
              "application/json": {
                schema: {
                  allOf: [
                    { $ref: "#/components/schemas/SuccessEnvelope" },
                    {
                      type: "object",
                      properties: {
                        data: { type: "array", items: { $ref: "#/components/schemas/Installment" } },
                      },
                    },
                  ],
                },
              },
            },
          },
          "404": { $ref: "#/components/responses/NotFound" },
        },
      },
    },
    "/api/transactions/{transactionId}/installments/{installmentId}": {
      get: {
        tags: ["Transactions"],
        summary: "Detalha uma parcela",
        parameters: [
          { $ref: "#/components/parameters/TransactionIdPath" },
          { name: "installmentId", in: "path", required: true, schema: { type: "integer" } },
        ],
        responses: {
          "200": {
            description: "Parcela encontrada",
            content: {
              "application/json": {
                schema: {
                  allOf: [
                    { $ref: "#/components/schemas/SuccessEnvelope" },
                    {
                      type: "object",
                      properties: { data: { $ref: "#/components/schemas/Installment" } },
                    },
                  ],
                },
              },
            },
          },
          "404": { $ref: "#/components/responses/NotFound" },
        },
      },
    },
    "/api/transactions/{transactionId}/payers": {
      get: {
        tags: ["Transactions"],
        summary: "Retorna o pagador de uma transação",
        parameters: [{ $ref: "#/components/parameters/TransactionIdPath" }],
        responses: {
          "200": {
            description: "Pagador encontrado",
            content: {
              "application/json": {
                schema: {
                  allOf: [
                    { $ref: "#/components/schemas/SuccessEnvelope" },
                    {
                      type: "object",
                      properties: { data: { $ref: "#/components/schemas/Payer" } },
                    },
                  ],
                },
              },
            },
          },
          "404": { $ref: "#/components/responses/NotFound" },
        },
      },
    },
  },
  components: {
    parameters: {
      TransactionId: {
        name: "id",
        in: "path",
        required: true,
        schema: { type: "integer" },
      },
      TransactionIdPath: {
        name: "transactionId",
        in: "path",
        required: true,
        schema: { type: "integer" },
      },
    },
    schemas: {
      SuccessEnvelope: {
        type: "object",
        properties: {
          success: { type: "boolean", example: true },
          status: { type: "integer", example: 200 },
        },
      },
      ErrorEnvelope: {
        type: "object",
        properties: {
          success: { type: "boolean", example: false },
          status: { type: "integer" },
          error: {
            type: "object",
            properties: {
              code: { type: "string", example: "E_NOT_FOUND" },
              message: { type: "string" },
            },
          },
        },
      },
      Transaction: {
        type: "object",
        properties: {
          id: { type: "integer" },
          externalId: { type: "string" },
          psp: { type: "string", enum: ["pagarme", "mercadopago"] },
          payerId: { type: "integer" },
          status: { type: "string" },
          originalAmount: { type: "number" },
          netAmount: { type: "number" },
          fees: { type: "number" },
          installmentCount: { type: "integer" },
          currency: { type: "string", example: "BRL" },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
      },
      Installment: {
        type: "object",
        properties: {
          id: { type: "integer" },
          transactionId: { type: "integer" },
          installmentNumber: { type: "integer" },
          amount: { type: "number" },
          fees: { type: "number" },
          status: { type: "string" },
          dueDate: { type: "string", format: "date-time", nullable: true },
          paidAt: { type: "string", format: "date-time", nullable: true },
        },
      },
      Payer: {
        type: "object",
        properties: {
          id: { type: "integer" },
          externalId: { type: "string" },
          psp: { type: "string" },
          name: { type: "string" },
          email: { type: "string" },
          documentType: { type: "string", enum: ["cpf", "cnpj"] },
          hasDocument: { type: "boolean" },
          createdAt: { type: "string", format: "date-time" },
        },
      },
      TransactionWithRelations: {
        allOf: [
          { $ref: "#/components/schemas/Transaction" },
          {
            type: "object",
            properties: {
              payer: { $ref: "#/components/schemas/Payer" },
              installments: { type: "array", items: { $ref: "#/components/schemas/Installment" } },
            },
          },
        ],
      },
      PaginatedTransactions: {
        type: "object",
        properties: {
          data: { type: "array", items: { $ref: "#/components/schemas/Transaction" } },
          total: { type: "integer" },
          page: { type: "integer" },
          limit: { type: "integer" },
          totalPages: { type: "integer" },
        },
      },
    },
    responses: {
      ValidationError: {
        description: "Parâmetros inválidos",
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/ErrorEnvelope" },
          },
        },
      },
      NotFound: {
        description: "Recurso não encontrado",
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/ErrorEnvelope" },
          },
        },
      },
      InternalError: {
        description: "Erro interno do servidor",
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/ErrorEnvelope" },
          },
        },
      },
    },
  },
} as const;
