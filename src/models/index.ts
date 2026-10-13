import mongoose, { Schema, type Model } from "mongoose";
import { randomUUID } from "node:crypto";
import {
  roles,
  categories,
  priorities,
  statuses,
  type Role,
} from "@/lib/constants";
export interface UserRecord {
  _id: string;
  name: string;
  email: string;
  role: Role;
  passwordHash: string;
  isActive: boolean;
  version: number;
  sessionVersion: number;
  createdAt: Date;
  updatedAt: Date;
}
export interface AssetRecord {
  _id: string;
  assetTag: string;
  type: string;
  manufacturer: string;
  model: string;
  serialNumber?: string;
  location: string;
  status: "AVAILABLE" | "ASSIGNED" | "UNDER_REPAIR" | "RETIRED";
  assignedUserId: string | null;
  notes?: string;
  purchaseDate?: Date | null;
  warrantyUntil?: Date | null;
  version: number;
  createdAt: Date;
  updatedAt: Date;
}
export interface TicketRecord {
  _id: string;
  number: string;
  title: string;
  description: string;
  category: (typeof categories)[number];
  priority: (typeof priorities)[number];
  status: (typeof statuses)[number];
  createdById: string;
  assignedToId: string | null;
  assetId: string | null;
  resolutionSummary?: string;
  resolvedAt?: Date | null;
  closedAt?: Date | null;
  version: number;
  createdAt: Date;
  updatedAt: Date;
}
export interface CommentRecord {
  _id: string;
  ticketId: string;
  authorId: string;
  message: string;
  isInternal: boolean;
  createdAt: Date;
}
export interface HistoryRecord {
  _id: string;
  ticketId: string;
  actorId: string;
  eventType: string;
  visibility: "PUBLIC" | "INTERNAL";
  oldValue?: string;
  newValue?: string;
  createdAt: Date;
}
const id = { type: String, default: () => randomUUID() };
const userSchema = new Schema<UserRecord>(
  {
    _id: id,
    name: { type: String, required: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    role: { type: String, enum: roles, default: "EMPLOYEE" },
    passwordHash: { type: String, required: true, select: false },
    isActive: { type: Boolean, default: true },
    version: { type: Number, default: 0 },
    sessionVersion: { type: Number, default: 0 },
  },
  { timestamps: true },
);
const assetSchema = new Schema<AssetRecord>(
  {
    _id: id,
    assetTag: { type: String, required: true, unique: true },
    type: String,
    manufacturer: String,
    model: String,
    serialNumber: String,
    location: String,
    status: {
      type: String,
      enum: ["AVAILABLE", "ASSIGNED", "UNDER_REPAIR", "RETIRED"],
      default: "AVAILABLE",
    },
    assignedUserId: { type: String, default: null },
    notes: String,
    purchaseDate: Date,
    warrantyUntil: Date,
    version: { type: Number, default: 0 },
  },
  { timestamps: true },
);
assetSchema.index(
  { serialNumber: 1 },
  {
    unique: true,
    partialFilterExpression: { serialNumber: { $type: "string" } },
  },
);
assetSchema.index({ assignedUserId: 1 });
assetSchema.index({ status: 1 });
const ticketSchema = new Schema<TicketRecord>(
  {
    _id: id,
    number: { type: String, required: true, unique: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    category: { type: String, enum: categories, required: true },
    priority: { type: String, enum: priorities, default: "MEDIUM" },
    status: { type: String, enum: statuses, default: "OPEN" },
    createdById: { type: String, required: true },
    assignedToId: { type: String, default: null },
    assetId: { type: String, default: null },
    resolutionSummary: String,
    resolvedAt: Date,
    closedAt: Date,
    version: { type: Number, default: 0 },
  },
  { timestamps: true },
);
ticketSchema.index({ createdById: 1, createdAt: -1, _id: 1 });
ticketSchema.index({ assignedToId: 1, status: 1 });
ticketSchema.index({ status: 1, createdAt: -1 });
ticketSchema.index({ assetId: 1 });
const commentSchema = new Schema<CommentRecord>(
  {
    _id: id,
    ticketId: { type: String, required: true },
    authorId: { type: String, required: true },
    message: { type: String, required: true },
    isInternal: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now },
  },
  { versionKey: false },
);
commentSchema.index({ ticketId: 1, createdAt: 1, _id: 1 });
const historySchema = new Schema<HistoryRecord>(
  {
    _id: id,
    ticketId: { type: String, required: true },
    actorId: { type: String, required: true },
    eventType: { type: String, required: true },
    visibility: {
      type: String,
      enum: ["PUBLIC", "INTERNAL"],
      default: "PUBLIC",
    },
    oldValue: String,
    newValue: String,
    createdAt: { type: Date, default: Date.now },
  },
  { versionKey: false },
);
historySchema.index({ ticketId: 1, createdAt: 1, _id: 1 });
function model<T>(name: string, schema: Schema<T>): Model<T> {
  return (mongoose.models[name] as Model<T>) || mongoose.model<T>(name, schema);
}
export const User = model("User", userSchema);
export const Asset = model("Asset", assetSchema);
export const Ticket = model("Ticket", ticketSchema);
export const Comment = model("Comment", commentSchema);
export const TicketHistory = model("TicketHistory", historySchema);
export interface AssetHistoryRecord {
  _id: string;
  assetId: string;
  actorId: string;
  eventType: string;
  summary: string;
  createdAt: Date;
}
const assetHistorySchema = new Schema<AssetHistoryRecord>(
  {
    _id: id,
    assetId: { type: String, required: true },
    actorId: { type: String, required: true },
    eventType: { type: String, required: true },
    summary: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
  },
  { versionKey: false },
);
assetHistorySchema.index({ assetId: 1, createdAt: 1, _id: 1 });
export const AssetHistory = model("AssetHistory", assetHistorySchema);
// A shared write coordinates cross-record invariants inside MongoDB transactions.
// It prevents write skew between assignments, role changes and last-admin checks.
const guardSchema = new Schema(
  { _id: String, version: { type: Number, default: 0 } },
  { versionKey: false },
);
export const WorkflowGuard =
  mongoose.models.WorkflowGuard || mongoose.model("WorkflowGuard", guardSchema);
const attemptSchema = new Schema(
  { _id: String, count: Number, expiresAt: Date },
  { versionKey: false },
);
attemptSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
export const LoginAttempt =
  mongoose.models.LoginAttempt || mongoose.model("LoginAttempt", attemptSchema);
export const RateLimit =
  mongoose.models.RateLimit ||
  mongoose.model("RateLimit", attemptSchema.clone());
export async function ensureIndexes() {
  for (const m of [
    User,
    Asset,
    Ticket,
    Comment,
    TicketHistory,
    AssetHistory,
    LoginAttempt,
    RateLimit,
    WorkflowGuard,
  ])
    await m.createIndexes();
  await WorkflowGuard.updateOne(
    { _id: "workflow" },
    { $setOnInsert: { version: 0 } },
    { upsert: true },
  );
}
