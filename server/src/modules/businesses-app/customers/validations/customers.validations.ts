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

export const createCustomerSchema = z
  .object({
    idBusiness: z
      .number({ error: "El negocio es obligatorio" })
      .int("El negocio debe ser un numero entero")
      .positive("El negocio debe ser valido"),

    name: z
      .string({ error: "El nombre es obligatorio" })
      .trim()
      .min(2, "El nombre del cliente debe tener al menos 2 caracteres")
      .max(160, "El nombre del cliente no puede superar los 160 caracteres"),

    phone: optionalString(
      80,
      "El telefono del cliente no puede superar los 80 caracteres",
    ),

    email: z
      .string()
      .trim()
      .email("El email del cliente no es valido")
      .max(160, "El email del cliente no puede superar los 160 caracteres")
      .optional()
      .nullable()
      .or(emptyStringToNull),

    address: optionalString(
      255,
      "La direccion del cliente no puede superar los 255 caracteres",
    ),

    observation: optionalString(
      255,
      "La observacion del cliente no puede superar los 255 caracteres",
    ),
  })
  .strict();

export const updateCustomerSchema = z
  .object({
    idBusiness: z
      .number({ error: "El negocio es obligatorio" })
      .int("El negocio debe ser un numero entero")
      .positive("El negocio debe ser valido"),

    idCustomer: z
      .number({ error: "El cliente es obligatorio" })
      .int("El cliente debe ser un numero entero")
      .positive("El cliente debe ser valido"),

    name: z
      .string()
      .trim()
      .min(2, "El nombre del cliente debe tener al menos 2 caracteres")
      .max(160, "El nombre del cliente no puede superar los 160 caracteres")
      .optional(),

    phone: optionalString(
      80,
      "El telefono del cliente no puede superar los 80 caracteres",
    ),

    email: z
      .string()
      .trim()
      .email("El email del cliente no es valido")
      .max(160, "El email del cliente no puede superar los 160 caracteres")
      .optional()
      .nullable()
      .or(emptyStringToNull),

    address: optionalString(
      255,
      "La direccion del cliente no puede superar los 255 caracteres",
    ),

    observation: optionalString(
      255,
      "La observacion del cliente no puede superar los 255 caracteres",
    ),
  })
  .strict()
  .refine(
    function hasEditableField(data) {
      return Object.keys(data).some(function isEditableField(key) {
        return key !== "idBusiness" && key !== "idCustomer";
      });
    },
    {
      message: "Debes enviar al menos un campo para actualizar",
    },
  );

export const toggleCustomerStatusSchema = z
  .object({
    idBusiness: z
      .number({ error: "El negocio es obligatorio" })
      .int("El negocio debe ser un numero entero")
      .positive("El negocio debe ser valido"),

    idCustomer: z
      .number({ error: "El cliente es obligatorio" })
      .int("El cliente debe ser un numero entero")
      .positive("El cliente debe ser valido"),

    isActive: z.boolean({ error: "El estado activo/inactivo es obligatorio" }),
  })
  .strict();
