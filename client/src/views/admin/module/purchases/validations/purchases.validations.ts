import { z } from "zod";

const moneySchema = (fieldName: string) => {
  return z
    .number({ error: `${fieldName} es obligatorio` })
    .min(0, `${fieldName} no puede ser negativo`);
};

export const purchaseCartItemSchema = z.object({
  idProduct: z.number().int().positive(),
  idDeposit: z.number().int().positive("Selecciona un deposito"),
  quantity: z.number().positive("La cantidad debe ser mayor a cero"),
  unitPrice: moneySchema("El precio unitario"),
  discountAmount: moneySchema("El descuento"),
  subtotal: moneySchema("El subtotal"),
});

export const createPurchaseSchema = z.object({
  idSupplier: z.number().int().positive().nullable(),
  subtotal: moneySchema("El subtotal"),
  discountTotal: moneySchema("El descuento total"),
  total: moneySchema("El total"),
  observation: z.string().max(255).nullable(),
  details: z.array(purchaseCartItemSchema).min(1, "Agrega productos al carrito"),
});
