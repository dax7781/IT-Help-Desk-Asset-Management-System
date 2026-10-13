import {
  beforeAll,
  beforeEach,
  afterAll,
  describe,
  it,
  expect,
  vi,
} from "vitest";
import { MongoMemoryReplSet } from "mongodb-memory-server";
import mongoose from "mongoose";
import path from "node:path";
import { encode, decode } from "next-auth/jwt";
import { connectDb } from "@/lib/db";
import {
  User,
  Asset,
  Ticket,
  Comment,
  TicketHistory,
  AssetHistory,
  RateLimit,
  LoginAttempt,
  ensureIndexes,
} from "@/models";
import { currentUser, requireMutationUser } from "@/lib/current-user";
import { authorizeCredentials } from "@/lib/authenticate";
import { consumeLimit } from "@/lib/rate-limit";
import { updateUser } from "@/services/users";
import { seedData, demoIds } from "../../scripts/seed-data";
import {
  initializeDemo,
  resetDemo,
  checkReleaseEnvironment,
} from "../../scripts/demo-operations";
const sessionState = vi.hoisted(() => ({
  value: null as null | { user: { id: string; sessionVersion: number } },
}));
vi.mock("@/lib/auth", () => ({ auth: async () => sessionState.value }));
const admin = {
  id: demoIds.admin,
  name: "Taylor Brooks",
  email: "admin@techdesk.example",
  role: "ADMIN" as const,
};
const password = "Security-fixture-password-2026";
let replica: MongoMemoryReplSet;
beforeAll(async () => {
  process.env.MONGOMS_DOWNLOAD_DIR = path.resolve(".local/binaries");
  replica = await MongoMemoryReplSet.create({
    instanceOpts: [{ launchTimeout: 60_000 }],
    replSet: { count: 1, storageEngine: "wiredTiger" },
  });
  process.env.MONGODB_URI = replica.getUri("techdesk_reset_test");
  await connectDb();
  await ensureIndexes();
});
beforeEach(async () => {
  for (const name of [
    User,
    Asset,
    Ticket,
    Comment,
    TicketHistory,
    AssetHistory,
    RateLimit,
    LoginAttempt,
  ].map((model) => model.collection.name))
    await mongoose.connection.collection(name).deleteMany({});
  await mongoose.connection.collection("demo_environment").deleteMany({});
  sessionState.value = null;
});
afterAll(async () => {
  await mongoose.disconnect();
  await replica?.stop();
});

describe("phase 7 authentication and abuse boundaries", () => {
  it("accepts normalized credentials but rejects wrong, unknown, inactive and malformed accounts", async () => {
    await seedData(password);
    const valid = await authorizeCredentials({
      email: " EMPLOYEE@techdesk.example ",
      password,
    });
    expect(valid).toMatchObject({ id: demoIds.employee, sessionVersion: 0 });
    expect(valid).not.toHaveProperty("passwordHash");
    expect(
      await authorizeCredentials({
        email: "employee@techdesk.example",
        password: "wrong-password",
      }),
    ).toBeNull();
    expect(
      await authorizeCredentials({
        email: "missing@techdesk.example",
        password,
      }),
    ).toBeNull();
    expect(
      await authorizeCredentials({ email: { $ne: null }, password }),
    ).toBeNull();
    await User.updateOne({ _id: demoIds.technician }, { isActive: false });
    expect(
      await authorizeCredentials({
        email: "technician@techdesk.example",
        password,
      }),
    ).toBeNull();
  });
  it("blocks login after the shared ten-attempt window without blocking a different account", async () => {
    await seedData(password);
    for (let i = 0; i < 10; i++)
      await consumeLimit("employee@techdesk.example", "login", 10, 600_000);
    expect(
      await authorizeCredentials({
        email: "employee@techdesk.example",
        password,
      }),
    ).toBeNull();
    expect(
      await authorizeCredentials({ email: "admin@techdesk.example", password }),
    ).toMatchObject({ id: demoIds.admin });
  });
  it("enforces an atomic concurrent quota, TTL metadata, subject isolation, and the next window", async () => {
    const outcomes = await Promise.allSettled(
      Array.from({ length: 20 }, () =>
        consumeLimit(
          "fixture",
          "writes",
          5,
          60_000,
          Date.UTC(2030, 0, 1, 0, 2, 5),
        ),
      ),
    );
    expect(
      outcomes.filter((result) => result.status === "fulfilled"),
    ).toHaveLength(5);
    expect(
      outcomes
        .filter((result) => result.status === "rejected")
        .every(
          (result) =>
            result.status === "rejected" && result.reason.status === 429,
        ),
    ).toBe(true);
    await expect(
      consumeLimit(
        "fixture",
        "writes",
        5,
        60_000,
        Date.UTC(2030, 0, 1, 0, 2, 5),
      ),
    ).rejects.toMatchObject({ retryAfter: 55 });
    await expect(
      consumeLimit("other", "writes", 5, 60_000, Date.UTC(2030, 0, 1, 0, 2, 5)),
    ).resolves.toBeUndefined();
    await expect(
      consumeLimit(
        "fixture",
        "writes",
        5,
        60_000,
        Date.UTC(2030, 0, 1, 0, 3, 0),
      ),
    ).resolves.toBeUndefined();
    const counter = await RateLimit.findOne({ count: 21 }).lean();
    expect(counter!.expiresAt).toEqual(new Date(Date.UTC(2030, 0, 1, 0, 4, 0)));
    expect(counter!._id).not.toContain("fixture");
    expect(
      (await RateLimit.collection.indexes()).some(
        (index) => index.expireAfterSeconds === 0,
      ),
    ).toBe(true);
  });
  it("rejects hostile origins before consuming write quota and limits authenticated mutations", async () => {
    await seedData(password);
    sessionState.value = { user: { id: demoIds.employee, sessionVersion: 0 } };
    const request = (origin: string) =>
      new Request("http://localhost:3000/api/tickets", {
        method: "POST",
        headers: { origin },
      });
    await expect(
      requireMutationUser(request("https://hostile.example")),
    ).rejects.toMatchObject({ status: 403 });
    expect(await RateLimit.countDocuments()).toBe(0);
    for (let i = 0; i < 60; i++)
      await requireMutationUser(request("http://localhost:3000"));
    await expect(
      requireMutationUser(request("http://localhost:3000")),
    ).rejects.toMatchObject({ status: 429 });
  });
  it("revokes old sessions after access changes and does not revive them on reactivation", async () => {
    await seedData(password);
    sessionState.value = {
      user: { id: demoIds.technician, sessionVersion: 0 },
    };
    expect((await currentUser())!.role).toBe("TECHNICIAN");
    await updateUser(admin, demoIds.technician, {
      version: 0,
      role: "EMPLOYEE",
      isActive: true,
    });
    expect(await currentUser()).toBeNull();
    sessionState.value.user.sessionVersion = 1;
    expect((await currentUser())!.role).toBe("EMPLOYEE");
    await updateUser(admin, demoIds.technician, {
      version: 1,
      role: "EMPLOYEE",
      isActive: false,
    });
    expect(await currentUser()).toBeNull();
    await updateUser(admin, demoIds.technician, {
      version: 2,
      role: "TECHNICIAN",
      isActive: true,
    });
    expect(await currentUser()).toBeNull();
    sessionState.value.user.sessionVersion = 3;
    expect((await currentUser())!.role).toBe("TECHNICIAN");
  });
  it("rejects expired, tampered, and wrong-secret encrypted Auth.js tokens", async () => {
    const secret = "isolated-test-secret-not-a-project-credential";
    const salt = "authjs.session-token";
    const token = await encode({
      token: { sub: demoIds.employee, sessionVersion: 0 },
      secret,
      salt,
      maxAge: 28_800,
    });
    expect((await decode({ token, secret, salt }))!.sub).toBe(demoIds.employee);
    const expired = await encode({
      token: { sub: demoIds.employee },
      secret,
      salt,
      maxAge: -60,
    });
    await expect(decode({ token: expired, secret, salt })).rejects.toThrow();
    await expect(
      decode({ token: token.slice(0, -12) + "aaaaaaaaaaaa", secret, salt }),
    ).rejects.toThrow();
    await expect(
      decode({ token, secret: "different-secret", salt }),
    ).rejects.toThrow();
  });
});

describe("phase 8 controlled demo operations", () => {
  it("refuses existing unmarked data and a reset without exact confirmation", async () => {
    await seedData(password);
    await expect(initializeDemo(password)).rejects.toThrow("existing database");
    await expect(resetDemo(password, "techdesk_reset_test")).rejects.toThrow(
      "marker",
    );
    expect(await User.countDocuments()).toBe(4);
    await User.deleteMany({});
    await Asset.deleteMany({});
    await Ticket.deleteMany({});
    await expect(initializeDemo(password)).rejects.toThrow("existing database");
    expect(await Comment.countDocuments()).toBe(1);
  });
  it("atomically resets a marked disposable demo, revokes sessions, and rolls back a seed failure", async () => {
    await initializeDemo(password);
    await expect(resetDemo(password, "wrong-name")).rejects.toThrow(
      "exact database name",
    );
    await User.updateOne(
      { _id: demoIds.employee },
      { name: "Changed fixture" },
    );
    const failure = vi
      .spyOn(Comment, "updateOne")
      .mockRejectedValueOnce(new Error("Reset seed unavailable"));
    try {
      await expect(resetDemo(password, "techdesk_reset_test")).rejects.toThrow(
        "Reset seed unavailable",
      );
    } finally {
      failure.mockRestore();
    }
    expect((await User.findById(demoIds.employee).lean())!.name).toBe(
      "Changed fixture",
    );
    await resetDemo(password, "techdesk_reset_test");
    expect((await User.findById(demoIds.employee).lean())!.name).toBe(
      "Alex Morgan",
    );
    expect(
      (await User.findById(demoIds.employee).lean())!.sessionVersion,
    ).toBeGreaterThan(0);
    expect(await Ticket.countDocuments()).toBe(2);
    expect(await User.countDocuments()).toBe(4);
  });
  it("refuses reset and initialization on an ordinary database even with confirmation", async () => {
    await mongoose.disconnect();
    process.env.MONGODB_URI = replica.getUri("techdesk");
    await connectDb();
    try {
      await expect(resetDemo(password, "techdesk")).rejects.toThrow(
        "restricted",
      );
      await expect(initializeDemo(password)).rejects.toThrow("restricted");
    } finally {
      await mongoose.disconnect();
      process.env.MONGODB_URI = replica.getUri("techdesk_reset_test");
      await connectDb();
    }
  });
  it("requires safe origins and a real secret before release preparation", () => {
    const env = {
      MONGODB_URI: "mongodb://localhost/techdesk",
      AUTH_SECRET: "a".repeat(40),
      AUTH_URL: "http://localhost:3000",
    };
    expect(() => checkReleaseEnvironment(env)).not.toThrow();
    expect(() =>
      checkReleaseEnvironment({ ...env, AUTH_URL: "https://demo.example" }),
    ).not.toThrow();
    for (const change of [
      { AUTH_SECRET: "replace-with-a-random-secret-of-at-least-32-characters" },
      { AUTH_URL: "http://demo.example" },
      { AUTH_URL: "https://demo.example/login" },
      { MONGODB_URI: "" },
      { MONGODB_URI: "mongodb+srv://cluster.example/" },
    ])
      expect(() => checkReleaseEnvironment({ ...env, ...change })).toThrow();
  });
});
