import { IHttpClient } from "../shared/http.client";
import { IPspAdapter, NormalizedTransaction, PspPage } from "./psp.adapter.interface";
import { normalizePagarme } from "./normalizers/pagarme.normalizer";

export class PagarmeAdapter implements IPspAdapter {
  readonly pspName = "pagarme";

  constructor(private readonly http: IHttpClient) {}

  async fetchPage(page: number): Promise<PspPage> {
    const size = Number(process.env.SYNC_PAGE_SIZE ?? 20);
    const data = await this.http.get<any>("/core/v5/orders", { page, size });

    return {
      transactions: data.data.map(normalizePagarme).filter(Boolean) as NormalizedTransaction[],
      hasMore: data.paging.has_more,
    };
  }

  async fetchById(externalId: string): Promise<NormalizedTransaction | null> {
    try {
      const data = await this.http.get<any>(`/core/v5/orders/${externalId}`);
      return normalizePagarme(data);
    } catch (err: any) {
      if (err?.response?.status === 404) return null;
      throw err;
    }
  }
}