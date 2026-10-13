import { connectDb } from "@/lib/db";
import { AppError } from "@/lib/errors";
import {
  activeActor,
  validId,
  mutate,
  requireStaff,
  conflict,
  escapeRegex,
} from "@/lib/workflow";
import { isStaff, ticketScope, type Actor } from "@/lib/permissions";
import { User, Asset, AssetHistory, Ticket, type AssetRecord } from "@/models";
import {
  assetCreateSchema,
  assetUpdateSchema,
  assetAssignmentSchema,
  assetQuerySchema,
} from "@/validators/assets";
import mongoose, { type ClientSession } from "mongoose";
function project(asset: AssetRecord, actor: Actor) {
  const safe = {
    id: asset._id,
    assetTag: asset.assetTag,
    type: asset.type,
    manufacturer: asset.manufacturer,
    model: asset.model,
    location: asset.location,
    status: asset.status,
  };
  return isStaff(actor)
    ? {
        ...safe,
        serialNumber: asset.serialNumber || "",
        notes: asset.notes || "",
        assignedUserId: asset.assignedUserId,
        version: asset.version,
        purchaseDate: asset.purchaseDate?.toISOString().slice(0, 10) || null,
        warrantyUntil: asset.warrantyUntil?.toISOString().slice(0, 10) || null,
      }
    : safe;
}
const scope = (actor: Actor) =>
  isStaff(actor) ? {} : { assignedUserId: actor.id };
export async function listAssets(actor: Actor, input: unknown) {
  const query = assetQuerySchema.parse(input);
  await connectDb();
  actor = await activeActor(actor);
  const filter = {
    ...scope(actor),
    ...(query.status ? { status: query.status } : {}),
    ...(query.type ? { type: query.type } : {}),
    ...(query.search
      ? {
          $or: ["assetTag", "manufacturer", "model"].map((field) => ({
            [field]: { $regex: escapeRegex(query.search), $options: "i" },
          })),
        }
      : {}),
  };
  const [records, total] = await Promise.all([
    Asset.find(filter)
      .sort({ assetTag: 1, _id: 1 })
      .skip((query.page - 1) * query.pageSize)
      .limit(query.pageSize)
      .lean(),
    Asset.countDocuments(filter),
  ]);
  return {
    items: records.map((a) => project(a, actor)),
    total,
    page: query.page,
    pages: Math.ceil(total / query.pageSize),
  };
}
export async function assetDetail(actor: Actor, id: string) {
  validId(id, "Asset");
  await connectDb();
  return mongoose.connection.transaction(
    (session) => assetDetailSnapshot(actor, id, session),
    { readConcern: { level: "snapshot" } },
  );
}
async function assetDetailSnapshot(
  actor: Actor,
  id: string,
  session: ClientSession,
) {
  actor = await activeActor(actor, session);
  const asset = await Asset.findOne({ _id: id, ...scope(actor) })
    .session(session)
    .lean();
  if (!asset) throw new AppError(404, "NOT_FOUND", "Asset not found.");
  // One snapshot prevents old ownership/version being combined with new history.
  // Reads on a transaction session must be sequential.
  const history = isStaff(actor)
    ? await AssetHistory.find({ assetId: id })
        .session(session)
        .sort({ createdAt: 1, _id: 1 })
        .lean()
    : [];
  const tickets = await Ticket.find({ assetId: id, ...ticketScope(actor) })
    .session(session)
    .select("_id number title status createdAt")
    .sort({ createdAt: -1, _id: 1 })
    .limit(50)
    .lean();
  const assigned =
    isStaff(actor) && asset.assignedUserId
      ? await User.findById(asset.assignedUserId)
          .session(session)
          .select("name")
          .lean()
      : null;
  return {
    ...project(asset, actor),
    assignedTo: assigned?.name || null,
    history: history.map((h) => ({
      id: h._id,
      eventType: h.eventType,
      summary: h.summary,
      createdAt: h.createdAt.toISOString(),
    })),
    tickets: tickets.map((t) => ({
      id: t._id,
      number: t.number,
      title: t.title,
      status: t.status,
      createdAt: t.createdAt.toISOString(),
    })),
  };
}
function details(data: {
  serialNumber?: string;
  purchaseDate?: string | null;
  warrantyUntil?: string | null;
}) {
  return {
    serialNumber: data.serialNumber || undefined,
    purchaseDate: data.purchaseDate ? new Date(data.purchaseDate) : null,
    warrantyUntil: data.warrantyUntil ? new Date(data.warrantyUntil) : null,
  };
}
async function lifecycle(
  status: AssetRecord["status"],
  assignedUserId: string | null,
  session: ClientSession,
) {
  if ((status === "AVAILABLE" || status === "RETIRED") && assignedUserId)
    throw new AppError(
      422,
      "INVALID_ASSIGNMENT",
      "Available or retired equipment must be unassigned.",
    );
  if (status === "ASSIGNED" && !assignedUserId)
    throw new AppError(
      422,
      "INVALID_ASSIGNMENT",
      "Assigned equipment requires an active user.",
    );
  if (
    assignedUserId &&
    !(await User.findOne({ _id: assignedUserId, isActive: true })
      .session(session)
      .lean())
  )
    throw new AppError(422, "INVALID_USER", "Select an active user.");
}
export async function createAsset(actor: Actor, input: unknown) {
  const data = assetCreateSchema.parse(input);
  return mutate(actor, async (actor, session) => {
    requireStaff(actor);
    const [asset] = await Asset.create(
      [
        {
          ...data,
          ...details(data),
          status: "AVAILABLE",
          assignedUserId: null,
        },
      ],
      { session },
    );
    await AssetHistory.create(
      [
        {
          assetId: asset._id,
          actorId: actor.id,
          eventType: "REGISTERED",
          summary: "Registered as available equipment.",
        },
      ],
      { session },
    );
    return project(asset, actor);
  });
}
export async function updateAsset(
  actor: Actor,
  id: string,
  input: unknown,
  assignmentOnly = false,
) {
  validId(id, "Asset");
  const fullData = assignmentOnly ? null : assetUpdateSchema.parse(input);
  const data = fullData || assetAssignmentSchema.parse(input);
  return mutate(actor, async (actor, session) => {
    requireStaff(actor);
    const asset = await Asset.findById(id).session(session);
    if (!asset) throw new AppError(404, "NOT_FOUND", "Asset not found.");
    if (asset.version !== data.version) conflict("asset");
    const status = fullData
      ? fullData.status
      : asset.status === "UNDER_REPAIR"
        ? "UNDER_REPAIR"
        : data.assignedUserId
          ? "ASSIGNED"
          : "AVAILABLE";
    if (
      asset.status === "RETIRED" &&
      (status !== "RETIRED" || data.assignedUserId)
    )
      throw new AppError(
        422,
        "RETIRED_ASSET",
        "Retired equipment cannot be reactivated or assigned.",
      );
    await lifecycle(status, data.assignedUserId, session);
    const previousName = asset.assignedUserId
      ? (await User.findById(asset.assignedUserId).session(session).lean())
          ?.name
      : null;
    const nextName = data.assignedUserId
      ? (await User.findById(data.assignedUserId).session(session).lean())?.name
      : null;
    const summary = `${asset.status} → ${status}; ${previousName || "Unassigned"} → ${nextName || "Unassigned"}`;
    if (fullData) {
      const { version: _version, ...fields } = fullData;
      void _version;
      asset.set({ ...fields, ...details(fullData) });
    }
    asset.status = status;
    asset.assignedUserId = data.assignedUserId;
    asset.version++;
    await asset.save({ session });
    await AssetHistory.create(
      [
        {
          assetId: id,
          actorId: actor.id,
          eventType: assignmentOnly ? "ASSIGNMENT" : "UPDATED",
          summary,
        },
      ],
      { session },
    );
    return project(asset, actor);
  });
}
