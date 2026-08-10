export const createIdempotencyKey = (): string => {
  return crypto.randomUUID();
};
