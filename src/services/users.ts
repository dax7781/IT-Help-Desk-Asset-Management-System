import { hash } from "bcryptjs";
import { connectDb } from "@/lib/db";
import { AppError } from "@/lib/errors";
import {
  activeActor,
  requireStaff,
  requireAdmin,
  validId,
  mutate,
  conflict,
  escapeRegex,
} from "@/lib/workflow";
import { User, Ticket, Asset, type UserRecord } from "@/models";
import type { Actor } from "@/lib/permissions";
import {
  userCreateSchema,
  userUpdateSchema,
  userQuerySchema,
} from "@/validators/users";
export function projectUser(user: UserRecord) {
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    isActive: user.isActive,
    version: user.version,
  };
}
export async function selectableUsers(actor: Actor) {
  await connectDb();
  actor = await activeActor(actor);
  requireStaff(actor);
  const records = await User.find({ isActive: true })
    .select("_id name role")
    .sort({ name: 1, _id: 1 })
    .limit(500)
    .lean();
  return records.map((u) => ({ id: u._id, name: u.name, role: u.role }));
}
export async function listUsers(actor: Actor, input: unknown) {
  const query = userQuerySchema.parse(input);
  await connectDb();
  requireAdmin(await activeActor(actor));
  const filter = {
    ...(query.role ? { role: query.role } : {}),
    ...(query.active ? { isActive: query.active === "true" } : {}),
    ...(query.search
      ? {
          $or: [
            { name: { $regex: escapeRegex(query.search), $options: "i" } },
            { email: { $regex: escapeRegex(query.search), $options: "i" } },
          ],
        }
      : {}),
  };
  const [records, total] = await Promise.all([
    User.find(filter)
      .sort({ name: 1, _id: 1 })
      .skip((query.page - 1) * 20)
      .limit(20)
      .lean(),
    User.countDocuments(filter),
  ]);
  return {
    items: records.map(projectUser),
    total,
    page: query.page,
    pages: Math.ceil(total / 20),
  };
}
export async function createUser(actor: Actor, input: unknown) {
  const data = userCreateSchema.parse(input);
  await connectDb();
  requireAdmin(await activeActor(actor));
  const passwordHash = await hash(data.password, 12);
  return mutate(actor, async (actor, session) => {
    requireAdmin(actor);
    const [user] = await User.create(
      [{ name: data.name, email: data.email, role: data.role, passwordHash }],
      { session },
    );
    return projectUser(user);
  });
}
export async function updateUser(actor: Actor, id: string, input: unknown) {
  validId(id, "User");
  const data = userUpdateSchema.parse(input);
  return mutate(actor, async (actor, session) => {
    requireAdmin(actor);
    const user = await User.findById(id).session(session);
    if (!user) throw new AppError(404, "NOT_FOUND", "User not found.");
    if (user.version !== data.version) conflict("user");
    if (
      user.isActive &&
      user.role === "ADMIN" &&
      (!data.isActive || data.role !== "ADMIN")
    ) {
      if (
        (await User.countDocuments({ isActive: true, role: "ADMIN" }).session(
          session,
        )) <= 1
      )
        throw new AppError(
          422,
          "LAST_ADMIN",
          "Keep at least one active administrator.",
        );
    }
    if (!data.isActive || data.role === "EMPLOYEE") {
      const assigned = await Ticket.countDocuments({
        assignedToId: id,
        status: { $in: ["OPEN", "ASSIGNED", "IN_PROGRESS"] },
      }).session(session);
      if (assigned)
        throw new AppError(
          422,
          "ACTIVE_ASSIGNMENTS",
          "Reassign this user's active tickets before deactivating or removing their staff role.",
        );
    }
    if (
      !data.isActive &&
      (await Asset.countDocuments({ assignedUserId: id }).session(session))
    )
      throw new AppError(
        422,
        "ASSIGNED_ASSETS",
        "Reassign or unassign this user's equipment before deactivation.",
      );
    if (user.role !== data.role || user.isActive !== data.isActive)
      user.sessionVersion = (user.sessionVersion ?? 0) + 1;
    user.role = data.role;
    user.isActive = data.isActive;
    user.version++;
    await user.save({ session });
    return projectUser(user);
  });
}
