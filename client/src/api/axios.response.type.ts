export type ApiResponse<T> = {
  status: boolean;
  message: string;
  data: T;
  errors?: Record<string, string>;
};

export type ApiMessageResponse = {
  status: boolean;
  message: string;
  errors?: Record<string, string>;
};