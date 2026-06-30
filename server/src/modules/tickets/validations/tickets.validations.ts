import { z } from "zod";

export const saleTicketParamSchema = z.object({
  idBusiness: z.number().int().positive("El negocio es obligatorio"),
  idSale: z.number().int().positive("La venta es obligatoria"),
});
