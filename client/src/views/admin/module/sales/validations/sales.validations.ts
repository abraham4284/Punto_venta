import { z } from "zod";

export const saleDetailSchema = z
  .object({
    idProduct: z.number().int().positive("El producto es obligatorio"),
    quantity: z.number().positive("La cantidad debe ser mayor a cero"),
    stockQuantity: z.number().min(0, "El stock disponible no puede ser negativo"),
    unitPrice: z.number().positive("El precio debe ser mayor a cero"),
    discount: z.number().min(0, "El descuento no puede ser negativo"),
    total: z.number().min(0, "El subtotal no puede ser negativo"),
  })
  .refine((item) => item.quantity <= item.stockQuantity, {
    path: ["quantity"],
    message: "La cantidad no puede superar el stock disponible",
  });

export const createSaleFormSchema = z.object({
  idCustomer: z
    .number({ error: "Selecciona un cliente" })
    .int("Selecciona un cliente valido")
    .positive("Selecciona un cliente"),
  idDeposit: z
    .number({ error: "Selecciona un deposito" })
    .int("Selecciona un deposito valido")
    .positive("Selecciona un deposito"),
  idPaymentMethod: z
    .number()
    .int("Selecciona una cuenta valida")
    .positive("Selecciona una cuenta valida")
    .nullable(),
  items: z
    .array(saleDetailSchema)
    .min(1, "Agrega al menos un producto al carrito"),
});
