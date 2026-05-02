# PSP Aggregator

Aplicação que centraliza transações de cartão de crédito de múltiplos provedores de pagamento (PSPs).

## Como rodar

# Copie o arquivo de variáveis de ambiente
cp .env.example .env

# Suba a aplicação
docker-compose up --build
```

A aplicação estará disponível em `http://localhost:3000`.

## Como executar a sincronização

```bash
curl -X POST http://localhost:3000/api/sync
```

A sincronização roda em background e retorna `202 Accepted` imediatamente.

## Endpoints

```
POST /api/sync
GET  /api/transactions
GET  /api/transactions/:id
GET  /api/transactions/:id/installments
GET  /api/transactions/:transactionId/installments/:installmentId
GET  /api/transactions/:transactionId/payers
GET  /health
```

## Como executar os testes

```bash
# Instale as dependências
npm install

# Rode os testes
npm test

## Variáveis de ambiente

| Variável | Descrição | Exemplo |
|---|---|---|
| `PORT` | Porta da aplicação | `3000` |
| `DB_HOST` | Host do banco | `db` |
| `DB_PORT` | Porta do banco | `3306` |
| `DB_USER` | Usuário do banco | `root` |
| `DB_PASSWORD` | Senha do banco | `root` |
| `DB_NAME` | Nome do banco | `psp_aggregator` |
| `PAGARME_BASE_URL` | URL base da API PagarMe | `http://mock:4000/pagarme` |
| `PAGARME_API_KEY` | Chave de API PagarMe | `test_key` |
| `MERCADOPAGO_BASE_URL` | URL base da API Mercado Pago | `http://mock:4000/mercadopago` |
| `MERCADOPAGO_ACCESS_TOKEN` | Token de acesso Mercado Pago | `test_token` |
| `SYNC_PAGE_SIZE` | Tamanho da página de sincronização | `20` |

## Decisões de arquitetura

**Adapter Pattern** — cada PSP tem seu próprio adapter que implementa `IPspAdapter`. O `SyncService` não conhece os detalhes de nenhum PSP, apenas a interface comum.

**Repository Pattern** — acesso ao banco isolado em `TransactionRepository` que implementa `ITransactionRepository`. Services dependem da interface, não da implementação.

**Dependency Inversion** — todas as dependências são injetadas via construtor e apontam para interfaces, facilitando testes unitários sem banco de dados.

**Normalizers** — funções puras que transformam o contrato de cada PSP no modelo interno da aplicação. Separadas dos adapters para manter responsabilidade única.

**Mock Server** — servidor Express local que simula os contratos dos PSPs, permitindo rodar a aplicação sem credenciais reais.

## Segurança

- CPF/CNPJ armazenado apenas como hash SHA-256, nunca em texto puro
- `document_hash` nunca exposto nas respostas da API