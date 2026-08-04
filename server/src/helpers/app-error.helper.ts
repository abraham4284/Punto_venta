export interface AppErrorShape {
  statusCode: number;
  code: string;
  message: string;
  data?: unknown;
  isOperational: true;
}

export function createAppError(params: {
  statusCode: number;
  code: string;
  message: string;
  data?: unknown;
}): AppErrorShape {
  return {
    statusCode: params.statusCode,
    code: params.code,
    message: params.message,
    data: params.data ?? null,
    isOperational: true,
  };
}

export function isAppError(error: unknown): error is AppErrorShape {
  if (!error || typeof error !== "object") return false;

  const candidate = error as Partial<AppErrorShape>;

  return (
    candidate.isOperational === true &&
    typeof candidate.statusCode === "number" &&
    typeof candidate.code === "string" &&
    typeof candidate.message === "string"
  );
}
