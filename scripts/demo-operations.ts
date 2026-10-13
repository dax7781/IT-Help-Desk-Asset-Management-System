import mongoose from "mongoose";
import { randomInt } from "node:crypto";
import {
  User,
  Asset,
  Ticket,
  Comment,
  TicketHistory,
  AssetHistory,
  LoginAttempt,
  RateLimit,
  WorkflowGuard,
  ensureIndexes,
} from "../src/models";
import { seedData } from "./seed-data";

export function checkReleaseEnvironment(
  env: Record<string, string | undefined>,
) {
  if (
    !env.MONGODB_URI ||
    !/^mongodb(?:\+srv)?:\/\/[^/]+\/[^/?#]+(?:\?|$)/.test(env.MONGODB_URI)
  )
    throw new Error(
      "Configure a MongoDB replica-set connection with an explicit database name in MONGODB_URI.",
    );
  if (
    !env.AUTH_SECRET ||
    env.AUTH_SECRET.length < 32 ||
    env.AUTH_SECRET.startsWith("replace-")
  )
    throw new Error(
      "Configure a random AUTH_SECRET of at least 32 characters.",
    );
  const url = new URL(env.AUTH_URL || "");
  const loopback = ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname);
  if (
    url.username ||
    url.password ||
    url.search ||
    url.hash ||
    url.pathname !== "/" ||
    (!loopback && url.protocol !== "https:") ||
    !["https:", "http:"].includes(url.protocol)
  )
    throw new Error(
      "AUTH_URL must be the app's HTTPS origin (HTTP allowed only on loopback).",
    );
}

function demoDatabase() {
  const name = mongoose.connection.name;
  if (!["techdesk_demo", "techdesk_reset_test"].includes(name))
    throw new Error(
      "Demo operations are restricted to techdesk_demo or techdesk_reset_test.",
    );
  return name;
}
const marker = () => mongoose.connection.collection("demo_environment");
export async function initializeDemo(password: string) {
  demoDatabase();
  const approved = await marker().findOne({ purpose: "fictional-demo" });
  if (!approved) {
    for (const name of [
      User,
      Asset,
      Ticket,
      Comment,
      TicketHistory,
      AssetHistory,
    ].map((model) => model.collection.name)) {
      if (await mongoose.connection.collection(name).countDocuments())
        throw new Error(
          "Refusing to mark an existing database as disposable demo data.",
        );
    }
  }
  await seedData(password);
  await marker().updateOne(
    { purpose: "fictional-demo" },
    { $set: { purpose: "fictional-demo" } },
    { upsert: true },
  );
}
export async function resetDemo(password: string, confirmation: string) {
  const name = demoDatabase();
  if (
    confirmation !== name ||
    !(await marker().findOne({ purpose: "fictional-demo" }))
  )
    throw new Error(
      "Reset requires the exact database name and an initialized fictional-demo marker.",
    );
  if (password.length < 12 || Buffer.byteLength(password, "utf8") > 72)
    throw new Error("Set a valid demo password before resetting.");
  await ensureIndexes();
  await mongoose.connection.transaction(async (session) => {
    await WorkflowGuard.updateOne(
      { _id: "workflow" },
      { $inc: { version: 1 } },
      { session },
    );
    // Explicit application collections only; no database drop or filesystem deletion.
    for (const collectionName of [
      User,
      Asset,
      Ticket,
      Comment,
      TicketHistory,
      AssetHistory,
    ].map((model) => model.collection.name))
      await mongoose.connection
        .collection(collectionName)
        .deleteMany({}, { session });
    await LoginAttempt.deleteMany({}, { session });
    await RateLimit.deleteMany({}, { session });
    await seedData(password, session);
    await User.updateMany(
      {},
      { $set: { sessionVersion: randomInt(1, 2 ** 31) } },
      { session },
    );
  });
}
