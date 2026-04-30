import { IHttpClient } from "../shared/http.client";
import { IPspAdapter, NormalizedTransaction, PspPage } from "./psp.adapter.interface";
import { normalizeMercadoPago } from "./normalizers/mercadopago.normalizer";

export class MercadoPagoAdapter implements IPspAdapter {
  readonly pspName = "mercadopago";

  constructor(private readonly http: IHttpClient) {}

  async fetchPage(page: number): Promise<PspPage> {
    const limit = Number(process.env.SYNC_PAGE_SIZE ?? 20);
    const offset = (page - 1) * limit;
    const data = await this.http.get<any>("/v1/payments/search", {
      payment_type_id: "credit_card",
      offset,
      limit,
    });

    const hasMore = data.paging.offset + data.paging.limit < data.paging.total;

    return {
      transactions: data.results.map(normalizeMercadoPago).filter(Boolean) as NormalizedTransaction[],
      hasMore,
    };
  }

  async fetchById(externalId: string): Promise<NormalizedTransaction | null> {
    try {
      const data = await this.http.get<any>(`/v1/payments/${externalId}`);
      return normalizeMercadoPago(data);
    } catch (err: any) {
      if (err?.response?.status === 404) return null;
      throw err;
    }
  }
}