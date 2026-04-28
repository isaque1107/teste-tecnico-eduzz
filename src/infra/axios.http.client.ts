import axios, { AxiosInstance } from "axios";
import { IHttpClient } from "../shared/http.client";

export class AxiosHttpClient implements IHttpClient {
  private readonly client: AxiosInstance;

  constructor(baseURL: string, headers: Record<string, string>) {
    this.client = axios.create({ baseURL, headers });
  }

  async get<T>(url: string, params?: Record<string, any>): Promise<T> {
    const { data } = await this.client.get<T>(url, { params });
    return data;
  }
}