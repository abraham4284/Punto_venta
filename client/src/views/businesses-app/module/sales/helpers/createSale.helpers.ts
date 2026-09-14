import { z } from "zod";

export const today = new Date().toISOString().slice(0, 10);

export const formatSaleMoney = (value: number): string => {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 2,
  }).format(value);
};

export const mapZodErrors = (error: z.ZodError): Record<string, string> => {
  return error.issues.reduce<Record<string, string>>((acc, issue) => {
    acc[issue.path.join(".")] = issue.message;
    return acc;
  }, {});
};

export const getFieldError = (
  errors: Record<string, string>,
  field: string,
): string | undefined => {
  return errors[field];
};
