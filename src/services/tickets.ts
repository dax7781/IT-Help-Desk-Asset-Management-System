import { randomUUID } from "node:crypto";
import mongoose, { type ClientSession } from "mongoose";
import { connectDb } from "@/lib/db";
import { AppError } from "@/lib/errors";
import {
  canReadTicket,
  isStaff,
  ticketScope,
  type Actor,
} from "@/lib/permissions";
import {
  User,
  Asset,
  Ticket,
  Comment,
  TicketHistory,
  type TicketRecord,
} from "@/models";
import {
  newTicketSchema,
  commentSchema,
  ticketQuerySchema,
} from "@/validators/tickets";
import {
  activeActor,
  validId,
  mutate,
  requireStaff,
  requireAdmin,
  conflict,
  escapeRegex,
} from "@/lib/workflow";
import { workflowSchema, internalCommentSchema } from "@/validators/workflow";
function project(ticket: TicketRecord) {
  return {
    id: ticket._id,
    number: ticket.number,
    title: ticket.title,
    description: ticket.description,
    category: ticket.category,
    priority: ticket.priority,
    status: ticket.status,
    createdAt: ticket.createdAt.toISOString(),
    updatedAt: ticket.updatedAt.toISOString(),
    version: ticket.version,
    assignedToId: ticket.assignedToId,
    createdById: ticket.createdById,
    resolutionSummary: ticket.resolutionSummary || null,
  };
}
export async function selectableAssets(actor: Actor) {
  await connectDb();
  actor = await activeActor(actor);
  const query = isStaff(actor)
    ? { status: { $ne: "RETIRED" as const } }
    : { assignedUserId: actor.id, status: { $ne: "RETIRED" as const } };
  const assets = await Asset.find(query)
    .select("_id assetTag type manufacturer model")
    .sort({ assetTag: 1 })
    .limit(100)
    .lean();
  return assets.map((a) => ({
    id: a._id,
    assetTag: a.assetTag,
    type: a.type,
    manufacturer: a.manufacturer,
    model: a.model,
  }));
}
export async function createTicket(actor: Actor, input: unknown) {
  const data = newTicketSchema.parse(input);
  return mutate(actor, async (actor, session) => {
    if (data.assetId) {
      const asset = await Asset.findById(data.assetId).session(session).lean();
      if (
        !asset ||
        asset.status === "RETIRED" ||
        (!isStaff(actor) && asset.assignedUserId !== actor.id)
      )
        throw new AppError(
          422,
          "INVALID_ASSET",
          "Select an available asset assigned to you.",
        );
    }
    const [ticket] = await Ticket.create(
      [
        {
          ...data,
          assetId: data.assetId || null,
          number:
            "TD-" + randomUUID().replaceAll("-", "").slice(0, 10).toUpperCase(),
          createdById: actor.id,
          assignedToId: null,
          priority: "MEDIUM",
          status: "OPEN",
        },
      ],
      { session },
    );
    await TicketHistory.create(
      [
        {
          ticketId: ticket._id,
          actorId: actor.id,
          eventType: "CREATED",
          visibility: "PUBLIC",
          newValue: "OPEN",
        },
      ],
      { session },
    );
    return project(ticket);
  });
}
export async function listTickets(actor: Actor, input: unknown) {
  const query = ticketQuerySchema.parse(input);
  await connectDb();
  actor = await activeActor(actor);
  if (query.assignee) requireStaff(actor);
  const filter = {
    ...ticketScope(actor),
    ...(query.status ? { status: query.status } : {}),
    ...(query.priority ? { priority: query.priority } : {}),
    ...(query.category ? { category: query.category } : {}),
    ...(query.assignee
      ? {
          assignedToId:
            query.assignee === "mine"
              ? actor.id
              : query.assignee === "unassigned"
                ? null
                : query.assignee,
        }
      : {}),
    ...(query.search
      ? {
          $or: [
            { number: { $regex: escapeRegex(query.search), $options: "i" } },
            { title: { $regex: escapeRegex(query.search), $options: "i" } },
          ],
        }
      : {}),
  };
  const [records, total] = await Promise.all([
    Ticket.find(filter)
      .sort({ createdAt: -1, _id: 1 })
      .skip((query.page - 1) * query.pageSize)
      .limit(query.pageSize)
      .lean(),
    Ticket.countDocuments(filter),
  ]);
  return {
    items: records.map(project),
    total,
    page: query.page,
    pageSize: query.pageSize,
    pages: Math.ceil(total / query.pageSize),
  };
}
export async function ticketDetail(actor: Actor, id: string) {
  validId(id);
  await connectDb();
  return mongoose.connection.transaction(
    (session) => ticketDetailSnapshot(actor, id, session),
    { readConcern: { level: "snapshot" } },
  );
}
async function ticketDetailSnapshot(
  actor: Actor,
  id: string,
  session: ClientSession,
) {
  actor = await activeActor(actor, session);
  const ticket = await Ticket.findById(id).session(session).lean();
  if (!ticket || !canReadTicket(actor, ticket))
    throw new AppError(404, "NOT_FOUND", "Ticket not found.");
  // Sequential snapshot reads keep the version, comments and history coherent.
  // Parallel operations on one transaction session are unsupported by Mongoose.
  const comments = await Comment.find({
    ticketId: id,
    ...(!isStaff(actor) ? { isInternal: false } : {}),
  })
    .session(session)
    .sort({ createdAt: 1, _id: 1 })
    .lean();
  const history = await TicketHistory.find({
    ticketId: id,
    ...(!isStaff(actor) ? { visibility: "PUBLIC" } : {}),
  })
    .session(session)
    .sort({ createdAt: 1, _id: 1 })
    .lean();
  const asset = ticket.assetId
    ? await Asset.findById(ticket.assetId)
        .session(session)
        .select("assetTag type manufacturer model assignedUserId")
        .lean()
    : null;
  const ids = [
    ...new Set([
      ticket.createdById,
      ...(ticket.assignedToId ? [ticket.assignedToId] : []),
      ...comments.map((c) => c.authorId),
      ...history.map((h) => h.actorId),
    ]),
  ];
  const people = await User.find({ _id: { $in: ids } })
    .session(session)
    .select("_id name")
    .lean();
  const names = new Map(people.map((u) => [u._id, u.name]));
  return {
    ...project(ticket),
    requester: names.get(ticket.createdById) || "Former user",
    assignee: ticket.assignedToId
      ? names.get(ticket.assignedToId) || "Former user"
      : null,
    asset: asset
      ? {
          id: asset._id,
          canViewDetails: isStaff(actor) || asset.assignedUserId === actor.id,
          assetTag: asset.assetTag,
          type: asset.type,
          manufacturer: asset.manufacturer,
          model: asset.model,
        }
      : null,
    comments: comments.map((c) => ({
      id: c._id,
      author: names.get(c.authorId) || "Former user",
      message: c.message,
      isInternal: c.isInternal,
      createdAt: c.createdAt.toISOString(),
    })),
    history: history.map((h) => ({
      id: h._id,
      actor: names.get(h.actorId) || "Former user",
      eventType: h.eventType,
      oldValue: h.oldValue || null,
      newValue: h.newValue || null,
      createdAt: h.createdAt.toISOString(),
    })),
  };
}
export async function addPublicComment(
  actor: Actor,
  id: string,
  input: unknown,
) {
  return addComment(actor, id, input, false);
}
export async function addComment(
  actor: Actor,
  id: string,
  input: unknown,
  internal = false,
) {
  validId(id);
  const data = (internal ? internalCommentSchema : commentSchema).parse(input);
  return mutate(actor, async (actor, session) => {
    if (internal) requireStaff(actor);
    const ticket = await Ticket.findById(id).session(session).lean();
    if (!ticket || !canReadTicket(actor, ticket))
      throw new AppError(404, "NOT_FOUND", "Ticket not found.");
    await Comment.create(
      [
        {
          ticketId: id,
          authorId: actor.id,
          message: data.message,
          isInternal: internal,
        },
      ],
      { session },
    );
    const changed = await Ticket.updateOne(
      { _id: id, version: ticket.version },
      { $inc: { version: 1 } },
      { session },
    );
    if (!changed.modifiedCount)
      throw new AppError(
        409,
        "CONFLICT",
        "This ticket changed. Refresh and try again.",
      );
    await TicketHistory.create(
      [
        {
          ticketId: id,
          actorId: actor.id,
          eventType: internal ? "INTERNAL_COMMENT" : "PUBLIC_COMMENT",
          visibility: internal ? "INTERNAL" : "PUBLIC",
        },
      ],
      { session },
    );
    return { message: "Comment added." };
  });
}

export async function updateTicket(actor: Actor, id: string, input: unknown) {
  validId(id, "Ticket");
  const data = workflowSchema.parse(input);
  return mutate(actor, async (actor, session) => {
    const ticket = await Ticket.findById(id).session(session);
    if (!ticket || !canReadTicket(actor, ticket))
      throw new AppError(404, "NOT_FOUND", "Ticket not found.");
    if (ticket.version !== data.version) conflict("ticket");
    const oldStatus = ticket.status;
    let eventType: string = data.action;
    let oldValue: string | undefined = oldStatus;
    let newValue: string | undefined;
    const working =
      ticket.status === "ASSIGNED" || ticket.status === "IN_PROGRESS";
    const allowedState = (ok: boolean) => {
      if (!ok)
        throw new AppError(
          422,
          "INVALID_TRANSITION",
          "This action is not available in the current ticket status.",
        );
    };
    if (data.action === "CLAIM" || data.action === "ASSIGN") {
      requireStaff(actor);
      if (data.action === "ASSIGN") requireAdmin(actor);
      const assignedId = data.action === "CLAIM" ? actor.id : data.assignedToId;
      allowedState(
        ticket.status === "OPEN" || (data.action === "ASSIGN" && working),
      );
      if (data.action === "CLAIM") allowedState(!ticket.assignedToId);
      let assigneeName = "Unassigned";
      if (assignedId) {
        const user = await User.findById(assignedId).session(session).lean();
        if (!user?.isActive || user.role === "EMPLOYEE")
          throw new AppError(
            422,
            "INVALID_ASSIGNEE",
            "Select an active technician or administrator.",
          );
        assigneeName = user.name;
      }
      if (assignedId === ticket.assignedToId)
        throw new AppError(422, "NO_CHANGE", "Choose a different assignment.");
      const previous = ticket.assignedToId
        ? await User.findById(ticket.assignedToId).session(session).lean()
        : null;
      oldValue = previous?.name || "Unassigned";
      ticket.assignedToId = assignedId;
      ticket.status = !assignedId
        ? "OPEN"
        : ticket.status === "OPEN"
          ? "ASSIGNED"
          : ticket.status;
      eventType = "ASSIGNMENT";
      newValue = assigneeName;
    } else if (data.action === "PRIORITY") {
      requireStaff(actor);
      if (ticket.priority === data.priority)
        throw new AppError(422, "NO_CHANGE", "Choose a different priority.");
      oldValue = ticket.priority;
      ticket.priority = data.priority;
      newValue = data.priority;
    } else {
      if (data.action === "REOPEN") {
        if (actor.role === "TECHNICIAN" && ticket.assignedToId !== actor.id)
          throw new AppError(
            403,
            "FORBIDDEN",
            "Only the assigned technician can reopen this ticket.",
          );
        allowedState(
          ticket.status === "RESOLVED" || ticket.status === "CLOSED",
        );
        const assigned = ticket.assignedToId
          ? await User.findById(ticket.assignedToId).session(session).lean()
          : null;
        if (!assigned?.isActive || assigned.role === "EMPLOYEE")
          ticket.assignedToId = null;
        ticket.status = ticket.assignedToId ? "ASSIGNED" : "OPEN";
        ticket.resolvedAt = null;
        ticket.closedAt = null;
        ticket.resolutionSummary = undefined;
        newValue = `${ticket.status}: ${data.reason}`;
      } else {
        requireStaff(actor);
        if (actor.role !== "ADMIN" && ticket.assignedToId !== actor.id)
          throw new AppError(
            403,
            "FORBIDDEN",
            "Claim or ask an administrator to assign this ticket before changing its status.",
          );
        if (data.action === "START") {
          allowedState(ticket.status === "ASSIGNED");
          ticket.status = "IN_PROGRESS";
        }
        if (data.action === "RESOLVE") {
          allowedState(ticket.status === "IN_PROGRESS");
          ticket.status = "RESOLVED";
          ticket.resolutionSummary = data.reason;
          ticket.resolvedAt = new Date();
        }
        if (data.action === "CLOSE") {
          allowedState(ticket.status === "RESOLVED");
          ticket.status = "CLOSED";
          ticket.closedAt = new Date();
        }
        newValue =
          data.action === "RESOLVE"
            ? `RESOLVED: ${data.reason}`
            : ticket.status;
      }
    }
    ticket.version++;
    await ticket.save({ session });
    await TicketHistory.create(
      [
        {
          ticketId: id,
          actorId: actor.id,
          eventType,
          visibility: "PUBLIC",
          oldValue,
          newValue,
        },
      ],
      { session },
    );
    return project(ticket);
  });
}
