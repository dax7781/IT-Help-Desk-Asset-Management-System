import mongoose, { type ClientSession } from "mongoose";
import { z } from "zod";
import { connectDb } from "@/lib/db";
import { User, WorkflowGuard } from "@/models";
import { AppError } from "@/lib/errors";
import { isStaff, type Actor } from "@/lib/permissions";

export function validId(id: string, entity = "Record") {
  if (!z.uuid().safeParse(id).success)
    throw new AppError(404, "NOT_FOUND", `${entity} not found.`);
}
export async function activeActor(
  actor: Actor,
  session?: ClientSession,
): Promise<Actor> {
  const query = User.findById(actor.id).select("_id name email role isActive");
  if (session) query.session(session);
  const user = await query.lean();
  if (!user?.isActive)
    throw new AppError(401, "UNAUTHENTICATED", "Please sign in to continue.");
  return { id: user._id, name: user.name, email: user.email, role: user.role };
}
export function requireStaff(actor: Actor) {
  if (!isStaff(actor))
    throw new AppError(403, "FORBIDDEN", "IT staff access is required.");
}
export function requireAdmin(actor: Actor) {
  if (actor.role !== "ADMIN")
    throw new AppError(403, "FORBIDDEN", "Administrator access is required.");
}
export function conflict(entity = "record"): never {
  throw new AppError(
    409,
    "CONFLICT",
    `This ${entity} changed. Refresh and try again.`,
  );
}
export async function mutate<T>(
  actor: Actor,
  work: (actor: Actor, session: ClientSession) => Promise<T>,
): Promise<T> {
  await connectDb();
  let result: T | undefined;
  await mongoose.connection.transaction(async (session) => {
    await WorkflowGuard.updateOne(
      { _id: "workflow" },
      { $inc: { version: 1 } },
      { session, upsert: true },
    );
    result = await work(await activeActor(actor, session), session);
  });
  return result!;
}
export function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
