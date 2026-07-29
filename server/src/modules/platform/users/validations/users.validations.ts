import { z } from "zod";

const platformRoleSchema = z.enum(["SUPER_ADMIN", "SUPPORT", "ANALYST"], {
  error: "El rol de plataforma no es valido",
});

function optionalBoolean(valueName: string) {
  return z.preprocess(function normalizeBoolean(value) {
    if (value === "" || value === null || value === undefined) return undefined;
    if (value === "true" || value === "1") return true;
    if (value === "false" || value === "0") return false;
    return value;
  }, z.boolean({ error: `${valueName} debe ser valido` }).optional());
}

export const listPlatformUsersQuerySchema = z.object({
  search: z.string().trim().max(150).optional(),
  role: platformRoleSchema.optional(),
  isActive: optionalBoolean("El estado"),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(15),
});

export const createPlatformUserSchema = z
  .object({
    name: z.string().trim().min(3, "El nombre debe tener al menos 3 caracteres").max(120),
    username: z
      .string()
      .trim()
      .min(3, "El usuario debe tener al menos 3 caracteres")
      .max(120),
    email: z
      .string()
      .trim()
      .email("El email debe ser valido")
      .optional()
      .or(z.literal(""))
      .transform(function normalizeEmail(value) {
        return value === "" ? null : value;
      }),
    password: z
      .string()
      .min(6, "La contrasena temporal debe tener al menos 6 caracteres")
      .max(100),
    platformRole: platformRoleSchema,
  })
  .strict();

export const changePlatformUserRoleSchema = z
  .object({
    platformRole: platformRoleSchema,
  })
  .strict();

export const changePlatformUserStatusSchema = z
  .object({
    isActive: z.coerce.boolean({ error: "El estado debe ser valido" }),
    reason: z
      .string()
      .trim()
      .min(5, "El motivo debe tener al menos 5 caracteres")
      .max(500),
  })
  .strict();

export const revokePlatformUserSessionsSchema = z
  .object({
    reason: z
      .string()
      .trim()
      .min(5, "El motivo debe tener al menos 5 caracteres")
      .max(500),
  })
  .strict();
