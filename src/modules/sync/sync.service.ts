import { IPspAdapter } from "../../psp/psp.adapter.interface";
import { TransactionRepository } from "../transactions/transaction.repository";
import { logger } from "../../shared/logger";

export class SyncService {
  constructor(
    private readonly adapters: IPspAdapter[],
    private readonly repository: TransactionRepository
  ) {}

  async syncAll(): Promise<void> {
    logger.info("Sincronização iniciada");

    for (const adapter of this.adapters) {
      await this.syncAdapter(adapter);
    }

    logger.info("Sincronização finalizada");
  }

  private async syncAdapter(adapter: IPspAdapter): Promise<void> {
    logger.info(`Iniciando sincronização do PSP: ${adapter.pspName}`);

    let page = 1;
    let hasMore = true;
    let totalSynced = 0;
    let totalFailed = 0;

    while (hasMore) {
      logger.info(`Buscando página ${page} do PSP: ${adapter.pspName}`);

      const { transactions, hasMore: more } = await adapter.fetchPage(page);
      hasMore = more;
      page++;

      for (const transaction of transactions) {
        try {
          const payerId = await this.repository.upsertPayer(transaction.payer, transaction.psp);
          const transactionId = await this.repository.upsertTransaction(transaction, payerId);
          await this.repository.upsertInstallments(transactionId, transaction.installments);
          totalSynced++;
        } catch (err) {
          totalFailed++;
          logger.error("Erro ao processar transação", {
            externalId: transaction.externalId,
            psp: transaction.psp,
            error: (err as Error).message,
          });
        }
      }
    }

    logger.info(`PSP ${adapter.pspName} finalizado`, { totalSynced, totalFailed });
  }
}