import { z } from "zod";
import { categories, priorities, statuses } from "@/lib/constants";
export const newTicketSchema = z
  .object({
    title: z.string().trim().min(5).max(150),
    description: z.string().trim().min(10).max(5000),
    category: z.enum(categories),
    assetId: z.uuid().nullable().optional(),
  })
  .strict();
export const commentSchema = z
  .object({ message: z.string().trim().min(1).max(5000) })
  .strict();
export const ticketQuerySchema = z
  .object({
    page: z.coerce.number().int().min(1).max(10000).default(1),
    pageSize: z.coerce.number().int().min(1).max(100).default(20),
    search: z.string().trim().max(150).default(""),
    status: z.enum(statuses).optional(),
    priority: z.enum(priorities).optional(),
    category: z.enum(categories).optional(),
    assignee: z
      .union([z.literal("mine"), z.literal("unassigned"), z.uuid()])
      .optional(),
  })
  .strict();
export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().pipe(z.email().max(254)),
  password: z
    .string()
    .min(1)
    .max(72)
    .refine((value) => new TextEncoder().encode(value).length <= 72),
});
