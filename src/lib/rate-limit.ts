import { createHash } from "node:crypto";
import { connectDb } from "./db";
import { AppError } from "./errors";
import { RateLimit } from "@/models";

// Shared MongoDB counters apply across app instances. Never trust forwarded IP
// headers here: anonymous traffic controls belong at the trusted hosting edge.
export async function consumeLimit(
  subject: string,
  scope: string,
  limit: number,
  windowMs: number,
  now = Date.now(),
) {
  await connectDb();
  const window = Math.floor(now / windowMs);
  const key = createHash("sha256")
    .update(`${scope}:${subject}:${window}`)
    .digest("hex");
  const update = {
    $inc: { count: 1 },
    $setOnInsert: { expiresAt: new Date((window + 2) * windowMs) },
  };
  let record;
  try {
    record = await RateLimit.findOneAndUpdate({ _id: key }, update, {
      upsert: true,
      returnDocument: "after",
    });
  } catch (error) {
    if (
      !error ||
      typeof error !== "object" ||
      !("code" in error) ||
      error.code !== 11000
    )
      throw error;
    // A concurrent first request may insert the same window before this upsert.
    record = await RateLimit.findOneAndUpdate({ _id: key }, update, {
      returnDocument: "after",
    });
  }
  if (!record) throw new Error("Rate-limit counter unavailable");
  if (record.count > limit)
    throw new AppError(
      429,
      "RATE_LIMITED",
      "Too many changes. Please try again later.",
      undefined,
      Math.max(1, Math.ceil(((window + 1) * windowMs - now) / 1000)),
    );
}

export async function limitMutations(userId: string) {
  await consumeLimit(userId, "mutation-minute", 60, 60_000);
  await consumeLimit(userId, "mutation-day", 1000, 86_400_000);
}
