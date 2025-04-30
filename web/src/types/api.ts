// types/api.ts
export interface ApiResponse<T> {
  data: T;
  status: number;
  statusText: string;
  headers: any;
  config: any;
  request?: any;
}

export interface ErrorResponse {
  message: string;
  statusCode?: number;
  errors?: Record<string, string[]>;
}
