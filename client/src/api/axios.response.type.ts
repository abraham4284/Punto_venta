export type ApiResponse<T> = {
  status: boolean | string;
  message: string;
  data: T;
  errors?: Record<string, string>;
};

export type ApiMessageResponse = {
  status: boolean | string;
  message: string;
  errors?: Record<string, string>;
};
