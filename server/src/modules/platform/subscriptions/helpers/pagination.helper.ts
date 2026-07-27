export function getPaginationParams(pageValue: unknown, limitValue: unknown) {
  const page = Math.max(Number(pageValue) || 1, 1);
  const rawLimit = Number(limitValue) || 15;
  const limit = Math.min(Math.max(rawLimit, 1), 100);
  const offset = (page - 1) * limit;

  return {
    page,
    limit,
    offset,
  };
}
