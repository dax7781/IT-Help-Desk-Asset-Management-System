import { z } from "zod";
import { roles } from "@/lib/constants";
import { versionSchema } from "@/validators/workflow";
export const userCreateSchema = z
  .object({
    name: z.string().trim().min(2).max(100),
    email: z.string().trim().toLowerCase().pipe(z.email().max(254)),
    role: z.enum(roles),
    password: z
      .string()
      .min(12)
      .max(72)
      .refine(
        (value) => new TextEncoder().encode(value).length <= 72,
        "Use a password of at most 72 UTF-8 bytes.",
      ),
  })
  .strict();
export const userUpdateSchema = z
  .object({
    version: versionSchema,
    role: z.enum(roles),
    isActive: z.boolean(),
  })
  .strict();
export const userQuerySchema = z
  .object({
    page: z.coerce.number().int().min(1).max(10000).default(1),
    search: z.string().trim().max(150).default(""),
    role: z.enum(roles).optional(),
    active: z.enum(["true", "false"]).optional(),
  })
  .strict();
