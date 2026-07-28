import { z } from "zod";

const roleSchema = z.enum(["ADMIN", "SELLER"], {
  message: "El rol debe ser ADMIN o SELLER",
});

const permissionEffectSchema = z.enum(["ALLOW", "DENY"], {
  message: "El efecto debe ser ALLOW o DENY",
});

const permissionOverrideSchema = z.object({
  code: z
    .string()
    .trim()
    .min(3, "El codigo de permiso es obligatorio")
    .max(100, "El codigo de permiso es demasiado largo"),
  effect: permissionEffectSchema,
});

export const listBusinessUsersQuerySchema = z.object({
  search: z.string().trim().optional().default(""),
  role: z
    .enum(["OWNER", "ADMIN", "SELLER", "ALL"], {
      message: "El rol no es valido",
    })
    .optional()
    .default("ALL"),
  status: z
    .enum(["ACTIVE", "INACTIVE", "ALL"], {
      message: "El estado no es valido",
    })
    .optional()
    .default("ALL"),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(15),
});

export const createBusinessUserSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(3, "El nombre debe tener al menos 3 caracteres")
      .max(120, "El nombre es demasiado largo"),
    username: z
      .string()
      .trim()
      .min(3, "El usuario debe tener al menos 3 caracteres")
      .max(120, "El usuario es demasiado largo"),
    email: z
      .string()
      .trim()
      .email("Ingrese un correo valido")
      .optional()
      .or(z.literal(""))
      .transform(function normalizeEmail(value) {
        return value === "" ? null : value;
      }),
    password: z
      .string()
      .min(6, "La contrasena debe tener al menos 6 caracteres")
      .max(120, "La contrasena es demasiado larga"),
    role: roleSchema,
    permissions: z.array(permissionOverrideSchema).optional().default([]),
  })
  .strict();

export const updateBusinessUserSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(3, "El nombre debe tener al menos 3 caracteres")
      .max(120, "El nombre es demasiado largo"),
    username: z
      .string()
      .trim()
      .min(3, "El usuario debe tener al menos 3 caracteres")
      .max(120, "El usuario es demasiado largo"),
    email: z
      .string()
      .trim()
      .email("Ingrese un correo valido")
      .optional()
      .or(z.literal(""))
      .transform(function normalizeEmail(value) {
        return value === "" ? null : value;
      }),
  })
  .strict();

export const changeBusinessUserRoleSchema = z
  .object({
    role: roleSchema,
  })
  .strict();

export const changeBusinessUserStatusSchema = z
  .object({
    isActive: z.boolean({
      message: "El estado debe ser verdadero o falso",
    }),
  })
  .strict();

export const updateBusinessUserPermissionsSchema = z
  .object({
    permissions: z.array(permissionOverrideSchema).default([]),
  })
  .strict()
  .superRefine(function validateDuplicates(value, ctx) {
    const codes = new Set<string>();

    value.permissions.forEach(function validatePermission(permission, index) {
      if (codes.has(permission.code)) {
        ctx.addIssue({
          code: "custom",
          path: ["permissions", index, "code"],
          message: "No se permiten permisos duplicados",
        });
      }

      codes.add(permission.code);
    });
  });
