import { z } from "zod";

const emptyStringToNull = z.literal("").transform(function transformEmptyString() {
  return null;
});

function optionalString(maxLength: number, message: string) {
  return z
    .string()
    .trim()
    .max(maxLength, message)
    .optional()
    .nullable()
    .or(emptyStringToNull);
}

const emailSchema = z
  .string()
  .trim()
  .email("Formato de correo electronico invalido")
  .max(160, "El email no puede superar los 160 caracteres")
  .optional()
  .nullable()
  .or(emptyStringToNull);

const idBusinessSchema = z
  .number({ error: "El negocio es obligatorio" })
  .int("El negocio debe ser un numero entero")
  .positive("El negocio debe ser valido");

const idSupplierSchema = z
  .number({ error: "El proveedor es obligatorio" })
  .int("El proveedor debe ser un numero entero")
  .positive("El proveedor debe ser valido");

const supplierBodySchema = z.object({
  name: z
    .string({ error: "El nombre del proveedor es obligatorio" })
    .trim()
    .min(3, "El nombre del proveedor debe tener al menos 3 caracteres")
    .max(160, "El nombre del proveedor no puede superar los 160 caracteres"),

  phone: optionalString(
    80,
    "El telefono del proveedor no puede superar los 80 caracteres",
  ),

  email: emailSchema,

  address: optionalString(
    255,
    "La direccion del proveedor no puede superar los 255 caracteres",
  ),

  observation: optionalString(
    255,
    "La observacion del proveedor no puede superar los 255 caracteres",
  ),
});

export const createSupplierSchema = supplierBodySchema
  .extend({
    idBusiness: idBusinessSchema,
  })
  .strict();

export const updateSupplierSchema = supplierBodySchema
  .extend({
    idBusiness: idBusinessSchema,
    idSupplier: idSupplierSchema,
    isActive: z.union([
      z.boolean({ error: "El estado activo/inactivo es obligatorio" }),
      z
        .number({ error: "El estado activo/inactivo es obligatorio" })
        .int("El estado debe ser 0 o 1")
        .min(0, "El estado debe ser 0 o 1")
        .max(1, "El estado debe ser 0 o 1")
        .transform(function transformNumberState(value) {
          return Boolean(value);
        }),
    ]),
  })
  .strict();
