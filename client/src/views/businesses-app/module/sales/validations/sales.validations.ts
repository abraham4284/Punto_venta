import { z } from "zod";

const productUnitTypeSchema = z.enum(["UNIT", "KG", "GRAM", "LITER", "METER"]);

export const saleDetailSchema = z
  .object({
    idProduct: z.number().int().positive("El producto es obligatorio"),
    quantity: z.number().positive("La cantidad debe ser mayor a cero"),
    unitType: productUnitTypeSchema,
    stockQuantity: z.number().min(0, "El stock disponible no puede ser negativo"),
    unitPrice: z.number().positive("El precio debe ser mayor a cero"),
    discount: z.number().min(0, "El descuento no puede ser negativo"),
    total: z.number().min(0, "El subtotal no puede ser negativo"),
  })
  .refine((item) => item.quantity <= item.stockQuantity, {
    path: ["quantity"],
    message: "La cantidad no puede superar el stock disponible",
  })
  .refine((item) => item.unitType !== "UNIT" || Number.isInteger(item.quantity), {
    path: ["quantity"],
    message: "Los productos por unidad solo permiten cantidades enteras",
  });

export const createSaleFormSchema = z.object({
  idCustomer: z
    .number()
    .int("Selecciona un cliente valido")
    .optional()
    .nullable(),
  idDeposit: z
    .number({ error: "Selecciona un deposito" })
    .int("Selecciona un deposito valido")
    .positive("Selecciona un deposito"),
  idCashSession: z
    .number({ error: "Debes abrir una caja antes de registrar una venta" })
    .int("La sesion de caja no es valida")
    .positive("Debes abrir una caja antes de registrar una venta"),
  idPaymentMethod: z
    .number({ error: "Selecciona un metodo de pago" })
    .int("Selecciona un metodo de pago valido")
    .positive("Selecciona un metodo de pago."),
  items: z
    .array(saleDetailSchema)
    .min(1, "Agrega al menos un producto al carrito"),
  delivery: z
    .object({
      enabled: z.boolean(),
      recipientName: z.string().trim(),
      deliveryAddress: z.string().trim(),
      deliveryReference: z.string().trim().optional(),
    })
    .superRefine((delivery, ctx) => {
      if (!delivery.enabled) return;

      if (delivery.recipientName.length < 2) {
        ctx.addIssue({
          code: "custom",
          path: ["recipientName"],
          message: "Ingresa el nombre del destinatario",
        });
      }

      if (delivery.deliveryAddress.length < 5) {
        ctx.addIssue({
          code: "custom",
          path: ["deliveryAddress"],
          message: "Ingresa una direccion de entrega valida",
        });
      }
    })
    .optional(),
});
