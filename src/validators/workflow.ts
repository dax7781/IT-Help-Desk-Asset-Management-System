import { z } from "zod";
import { priorities } from "@/lib/constants";
export const versionSchema = z
  .number()
  .int()
  .min(0)
  .max(Number.MAX_SAFE_INTEGER);
const reason = z.string().trim().min(5).max(2000);
export const workflowSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("CLAIM"), version: versionSchema }).strict(),
  z
    .object({
      action: z.literal("ASSIGN"),
      version: versionSchema,
      assignedToId: z.uuid().nullable(),
    })
    .strict(),
  z.object({ action: z.literal("START"), version: versionSchema }).strict(),
  z
    .object({ action: z.literal("RESOLVE"), version: versionSchema, reason })
    .strict(),
  z.object({ action: z.literal("CLOSE"), version: versionSchema }).strict(),
  z
    .object({ action: z.literal("REOPEN"), version: versionSchema, reason })
    .strict(),
  z
    .object({
      action: z.literal("PRIORITY"),
      version: versionSchema,
      priority: z.enum(priorities),
    })
    .strict(),
]);
export const internalCommentSchema = z
  .object({
    message: z.string().trim().min(1).max(5000),
    isInternal: z.literal(true),
  })
  .strict();
