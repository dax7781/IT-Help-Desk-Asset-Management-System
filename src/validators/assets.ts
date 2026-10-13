import { z } from "zod";
import { versionSchema } from "@/validators/workflow";
import { assetTypes, assetStatuses } from "@/lib/constants";
const date = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .refine((value) => {
    const parsed = new Date(value);
    return (
      !Number.isNaN(parsed.getTime()) &&
      parsed.toISOString().slice(0, 10) === value
    );
  }, "Enter a valid date.")
  .nullable()
  .optional();
const fields = {
  assetTag: z.string().trim().toUpperCase().min(2).max(50),
  type: z.enum(assetTypes),
  manufacturer: z.string().trim().min(1).max(100),
  model: z.string().trim().min(1).max(100),
  serialNumber: z.string().trim().toUpperCase().max(100).optional(),
  location: z.string().trim().min(1).max(150),
  notes: z.string().trim().max(5000).optional(),
  purchaseDate: date,
  warrantyUntil: date,
};
const datesValid = (data: {
  purchaseDate?: string | null;
  warrantyUntil?: string | null;
}) =>
  !data.purchaseDate ||
  !data.warrantyUntil ||
  data.warrantyUntil >= data.purchaseDate;
export const assetCreateSchema = z
  .object(fields)
  .strict()
  .refine(datesValid, {
    path: ["warrantyUntil"],
    message: "Warranty end must be on or after purchase.",
  });
export const assetUpdateSchema = z
  .object({
    ...fields,
    version: versionSchema,
    status: z.enum(assetStatuses),
    assignedUserId: z.uuid().nullable(),
  })
  .strict()
  .refine(datesValid, {
    path: ["warrantyUntil"],
    message: "Warranty end must be on or after purchase.",
  });
export const assetAssignmentSchema = z
  .object({ version: versionSchema, assignedUserId: z.uuid().nullable() })
  .strict();
export const assetQuerySchema = z
  .object({
    page: z.coerce.number().int().min(1).max(10000).default(1),
    pageSize: z.coerce.number().int().min(1).max(100).default(20),
    search: z.string().trim().max(150).default(""),
    status: z.enum(assetStatuses).optional(),
    type: z.enum(assetTypes).optional(),
  })
  .strict();
