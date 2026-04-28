export interface HttpResponse<T = unknown> {
  success: boolean;
  status: number;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
}