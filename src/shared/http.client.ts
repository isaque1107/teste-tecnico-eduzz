export interface IHttpClient {
  get<T>(url: string, params?: Record<string, any>): Promise<T>;
}