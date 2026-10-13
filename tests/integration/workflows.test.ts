import {
  beforeAll,
  beforeEach,
  afterAll,
  describe,
  it,
  expect,
  vi,
} from "vitest";
import { randomUUID } from "node:crypto";
import path from "node:path";
import mongoose from "mongoose";
import { MongoMemoryReplSet } from "mongodb-memory-server";
import { connectDb } from "@/lib/db";
import {
  User,
  Asset,
  Ticket,
  TicketHistory,
  Comment,
  AssetHistory,
} from "@/models";
import { seedData, demoIds } from "../../scripts/seed-data";
import {
  updateTicket,
  createTicket,
  ticketDetail,
  listTickets,
  addComment,
} from "@/services/tickets";
import {
  createAsset,
  updateAsset,
  listAssets,
  assetDetail,
} from "@/services/assets";
import { createUser, updateUser, listUsers } from "@/services/users";
import { dashboardStats } from "@/services/reporting";
import type { Actor } from "@/lib/permissions";
let replica: MongoMemoryReplSet;
const employee: Actor = {
  id: demoIds.employee,
  name: "Alex Morgan",
  email: "employee@techdesk.example",
  role: "EMPLOYEE",
};
const technician: Actor = {
  ...employee,
  id: demoIds.technician,
  role: "TECHNICIAN",
};
const admin: Actor = { ...employee, id: demoIds.admin, role: "ADMIN" };
const other: Actor = { ...employee, id: demoIds.otherEmployee };
const assetInput = {
  assetTag: "TD-TEST-100",
  type: "LAPTOP",
  manufacturer: "Lenovo",
  model: "ThinkPad",
  location: "Test office",
  serialNumber: "SERIAL-100",
  notes: "Private stock notes",
  purchaseDate: "2026-01-10",
  warrantyUntil: "2027-01-10",
};
beforeAll(async () => {
  process.env.MONGOMS_DOWNLOAD_DIR = path.resolve(".local/binaries");
  replica = await MongoMemoryReplSet.create({
    instanceOpts: [{ launchTimeout: 60_000 }],
    replSet: { count: 1, storageEngine: "wiredTiger" },
  });
  process.env.MONGODB_URI = replica.getUri("techdesk_test");
  await connectDb();
});
beforeEach(async () => {
  await Promise.all([
    User.deleteMany({}),
    Asset.deleteMany({}),
    Ticket.deleteMany({}),
    TicketHistory.deleteMany({}),
    Comment.deleteMany({}),
    AssetHistory.deleteMany({}),
  ]);
  await seedData("Fictional-test-password-2026");
});
afterAll(async () => {
  await mongoose.disconnect();
  await replica?.stop();
});
const version = async () =>
  (await Ticket.findById(demoIds.ticket).lean())!.version;
const change = async (actor: Actor, action: string, fields = {}) =>
  updateTicket(actor, demoIds.ticket, {
    action,
    version: await version(),
    ...fields,
  });

describe("phase 4 workflow", () => {
  it("keeps asset ownership, version and history coherent during a concurrent assignment", async () => {
    const asset = await createAsset(admin, assetInput);
    const query = AssetHistory.find({ assetId: asset.id });
    const originalExec = query.exec.bind(query);
    const find = vi.spyOn(AssetHistory, "find").mockReturnValueOnce(query);
    const exec = vi.spyOn(query, "exec").mockImplementationOnce(async () => {
      await updateAsset(
        admin,
        asset.id,
        { version: 0, assignedUserId: employee.id },
        true,
      );
      return originalExec();
    });
    try {
      const snapshot = await assetDetail(admin, asset.id);
      expect(snapshot).toMatchObject({
        version: 0,
        assignedUserId: null,
        assignedTo: null,
        status: "AVAILABLE",
      });
      expect(snapshot.history.map((entry) => entry.eventType)).toEqual([
        "REGISTERED",
      ]);
    } finally {
      find.mockRestore();
      exec.mockRestore();
    }
    const next = await assetDetail(admin, asset.id);
    expect(next).toMatchObject({
      version: 1,
      assignedUserId: employee.id,
      status: "ASSIGNED",
    });
    expect(next.history.map((entry) => entry.eventType)).toEqual([
      "REGISTERED",
      "ASSIGNMENT",
    ]);
  });
  it("completes claim, start, resolve, close and owner reopen with immutable history", async () => {
    expect((await change(technician, "CLAIM")).status).toBe("ASSIGNED");
    expect((await change(technician, "START")).status).toBe("IN_PROGRESS");
    expect(
      (
        await change(technician, "RESOLVE", {
          reason: "Replaced faulty wireless adapter.",
        })
      ).status,
    ).toBe("RESOLVED");
    expect((await change(technician, "CLOSE")).status).toBe("CLOSED");
    const reopened = await change(employee, "REOPEN", {
      reason: "The same issue returned today.",
    });
    expect(reopened).toMatchObject({
      status: "ASSIGNED",
      resolutionSummary: null,
    });
    const record = await Ticket.findById(demoIds.ticket).lean();
    expect(record!.resolvedAt).toBeNull();
    expect(record!.closedAt).toBeNull();
    const history = await TicketHistory.find({
      ticketId: demoIds.ticket,
      eventType: "RESOLVE",
    }).lean();
    expect(history[0].newValue).toContain("Replaced faulty");
    expect(
      await TicketHistory.countDocuments({
        ticketId: demoIds.ticket,
        eventType: "REOPEN",
      }),
    ).toBe(1);
  });
  it("rejects employee controls, other technician transitions, skipped states and missing reasons", async () => {
    await expect(change(employee, "CLAIM")).rejects.toMatchObject({
      status: 403,
    });
    await expect(
      change(admin, "RESOLVE", { reason: "Cannot skip states." }),
    ).rejects.toMatchObject({ status: 422 });
    await change(technician, "CLAIM");
    const person = await User.create({
      name: "Second Technician",
      email: "second@techdesk.example",
      role: "TECHNICIAN",
      passwordHash: "test-only",
    });
    await expect(
      change({ ...technician, id: person.id }, "START"),
    ).rejects.toMatchObject({ status: 403 });
    await expect(
      change(technician, "ASSIGN", { assignedToId: person.id }),
    ).rejects.toMatchObject({ status: 403 });
    await change(technician, "START");
    await expect(change(technician, "RESOLVE", {})).rejects.toHaveProperty(
      "name",
      "ZodError",
    );
    await expect(
      change(technician, "RESOLVE", { reason: "   " }),
    ).rejects.toHaveProperty("name", "ZodError");
  });
  it("validates admin assignment, preserves In Progress on reassignment and returns Open on unassignment", async () => {
    await expect(
      change(admin, "ASSIGN", { assignedToId: employee.id }),
    ).rejects.toMatchObject({ status: 422 });
    await change(admin, "ASSIGN", { assignedToId: technician.id });
    await change(technician, "START");
    expect(
      (await change(admin, "ASSIGN", { assignedToId: admin.id })).status,
    ).toBe("IN_PROGRESS");
    expect((await change(admin, "ASSIGN", { assignedToId: null })).status).toBe(
      "OPEN",
    );
    await User.updateOne({ _id: technician.id }, { isActive: false });
    await expect(
      change(admin, "ASSIGN", { assignedToId: technician.id }),
    ).rejects.toMatchObject({ status: 422 });
  });
  it("lets one concurrent claim win, rejects stale versions and rolls back if history fails", async () => {
    const expected = await version();
    const outcomes = await Promise.allSettled([
      updateTicket(technician, demoIds.ticket, {
        action: "CLAIM",
        version: expected,
      }),
      updateTicket(admin, demoIds.ticket, {
        action: "CLAIM",
        version: expected,
      }),
    ]);
    expect(outcomes.filter((o) => o.status === "fulfilled")).toHaveLength(1);
    expect(outcomes.find((o) => o.status === "rejected")).toMatchObject({
      reason: { status: 409 },
    });
    await expect(
      updateTicket(admin, demoIds.ticket, {
        action: "PRIORITY",
        priority: "HIGH",
        version: expected,
      }),
    ).rejects.toMatchObject({ status: 409 });
    const before = await Ticket.findById(demoIds.ticket).lean();
    const failure = vi
      .spyOn(TicketHistory, "create")
      .mockRejectedValueOnce(new Error("History unavailable"));
    try {
      await expect(
        change(admin, "PRIORITY", { priority: "CRITICAL" }),
      ).rejects.toThrow("History unavailable");
    } finally {
      failure.mockRestore();
    }
    expect((await Ticket.findById(demoIds.ticket).lean())!.version).toBe(
      before!.version,
    );
    expect((await Ticket.findById(demoIds.ticket).lean())!.priority).toBe(
      "MEDIUM",
    );
  });
  it("filters staff workload and hides internal note text, events, and counts from employees", async () => {
    await change(technician, "CLAIM");
    await change(technician, "PRIORITY", { priority: "HIGH" });
    expect(
      (await listTickets(technician, { assignee: "mine", priority: "HIGH" }))
        .total,
    ).toBe(1);
    expect((await listTickets(admin, { assignee: "unassigned" })).total).toBe(
      1,
    );
    await expect(
      listTickets(employee, { assignee: "mine" }),
    ).rejects.toMatchObject({ status: 403 });
    const before = await ticketDetail(employee, demoIds.ticket);
    await addComment(
      technician,
      demoIds.ticket,
      { message: "Private engineering investigation", isInternal: true },
      true,
    );
    const after = await ticketDetail(employee, demoIds.ticket);
    expect(after.comments.length).toBe(before.comments.length);
    expect(after.history.length).toBe(before.history.length);
    expect(JSON.stringify(after)).not.toContain("Private engineering");
    await expect(
      addComment(
        employee,
        demoIds.ticket,
        { message: "Forged internal", isInternal: true },
        true,
      ),
    ).rejects.toMatchObject({ status: 403 });
  });
  it("reopens to Open if the former assignee is inactive and rejects non-owner reopening", async () => {
    await change(technician, "CLAIM");
    await change(technician, "START");
    await change(technician, "RESOLVE", {
      reason: "Fixed the network configuration.",
    });
    await updateUser(admin, technician.id, {
      version: 0,
      role: "TECHNICIAN",
      isActive: false,
    });
    await expect(
      change(other, "REOPEN", { reason: "Not my request." }),
    ).rejects.toMatchObject({ status: 404 });
    expect(
      (
        await change(employee, "REOPEN", {
          reason: "Network failed again today.",
        })
      ).status,
    ).toBe("OPEN");
  });
});

describe("phase 5 inventory and administration", () => {
  it("paginates and filters inventory without leaking other employees' equipment", async () => {
    await Asset.insertMany(
      Array.from({ length: 23 }, (_, i) => ({
        _id: randomUUID(),
        assetTag: `PAGE-${String(i).padStart(3, "0")}`,
        type: "MONITOR",
        manufacturer: "Dell",
        model: "Fictional monitor",
        location: "Test office",
        status: "ASSIGNED",
        assignedUserId: i < 18 ? employee.id : other.id,
      })),
    );
    const ids: string[] = [];
    for (let page = 1; page <= 4; page++) {
      const result = await listAssets(employee, {
        search: "PAGE-",
        type: "MONITOR",
        status: "ASSIGNED",
        page,
        pageSize: 5,
      });
      expect(result.total).toBe(18);
      expect(result.pages).toBe(4);
      ids.push(...result.items.map((a) => a.id));
    }
    expect(new Set(ids).size).toBe(18);
    expect(
      (await listAssets(admin, { search: "PAGE-", type: "MONITOR" })).total,
    ).toBe(23);
    expect((await listAssets(admin, { search: ".*" })).total).toBe(0);
  });
  it("coordinates equipment assignment with user deactivation", async () => {
    const user = await User.create({
      name: "Equipment race fixture",
      email: "asset-race@techdesk.example",
      role: "EMPLOYEE",
      passwordHash: "test-only",
    });
    const asset = await createAsset(admin, assetInput);
    const results = await Promise.allSettled([
      updateAsset(
        admin,
        asset.id,
        { version: 0, assignedUserId: user.id },
        true,
      ),
      updateUser(admin, user.id, {
        version: 0,
        role: "EMPLOYEE",
        isActive: false,
      }),
    ]);
    expect(results.filter((r) => r.status === "fulfilled")).toHaveLength(1);
    const person = await User.findById(user.id).lean(),
      record = await Asset.findById(asset.id).lean();
    expect(person!.isActive || record!.assignedUserId !== user.id).toBe(true);
  });
  it("registers unique equipment, rejects invalid dates and hides staff fields from employees", async () => {
    await expect(createAsset(employee, assetInput)).rejects.toMatchObject({
      status: 403,
    });
    await expect(
      createAsset(admin, { ...assetInput, purchaseDate: "2026-02-30" }),
    ).rejects.toHaveProperty("name", "ZodError");
    await expect(
      createAsset(admin, { ...assetInput, warrantyUntil: "2025-01-01" }),
    ).rejects.toHaveProperty("name", "ZodError");
    const created = await createAsset(technician, assetInput);
    expect(created.status).toBe("AVAILABLE");
    await expect(createAsset(admin, assetInput)).rejects.toMatchObject({
      code: 11000,
    });
    await expect(
      createAsset(admin, { ...assetInput, assetTag: "TD-TEST-101" }),
    ).rejects.toMatchObject({ code: 11000 });
    await updateAsset(
      technician,
      created.id,
      { version: 0, assignedUserId: employee.id },
      true,
    );
    const detail = await assetDetail(employee, created.id);
    expect(detail.history).toEqual([]);
    expect(detail).not.toHaveProperty("serialNumber");
    expect(detail).not.toHaveProperty("notes");
    expect((await listAssets(employee, { search: "TD-TEST-100" })).total).toBe(
      1,
    );
    await expect(assetDetail(other, created.id)).rejects.toMatchObject({
      status: 404,
    });
    expect(await AssetHistory.countDocuments({ assetId: created.id })).toBe(2);
  });
  it("enforces lifecycle invariants, stale writes and retirement while preserving old repair links", async () => {
    const created = await createAsset(admin, assetInput);
    await expect(
      updateAsset(admin, created.id, {
        ...assetInput,
        version: 0,
        status: "ASSIGNED",
        assignedUserId: null,
      }),
    ).rejects.toMatchObject({ status: 422 });
    await expect(
      updateAsset(admin, created.id, {
        ...assetInput,
        version: 0,
        status: "AVAILABLE",
        assignedUserId: employee.id,
      }),
    ).rejects.toMatchObject({ status: 422 });
    await updateAsset(
      admin,
      created.id,
      { version: 0, assignedUserId: employee.id },
      true,
    );
    const ticket = await createTicket(employee, {
      title: "Repair fixture ticket",
      description: "Fictional equipment repair request.",
      category: "HARDWARE",
      assetId: created.id,
    });
    await expect(
      updateAsset(
        admin,
        created.id,
        { version: 0, assignedUserId: other.id },
        true,
      ),
    ).rejects.toMatchObject({ status: 409 });
    await updateAsset(admin, created.id, {
      ...assetInput,
      version: 1,
      status: "UNDER_REPAIR",
      assignedUserId: employee.id,
    });
    await updateAsset(admin, created.id, {
      ...assetInput,
      version: 2,
      status: "RETIRED",
      assignedUserId: null,
    });
    expect((await assetDetail(admin, created.id)).tickets[0].id).toBe(
      ticket.id,
    );
    expect((await ticketDetail(employee, ticket.id)).asset!.assetTag).toBe(
      assetInput.assetTag,
    );
    await expect(
      updateAsset(
        admin,
        created.id,
        { version: 3, assignedUserId: employee.id },
        true,
      ),
    ).rejects.toMatchObject({ status: 422 });
    await expect(
      createTicket(admin, {
        title: "Retired asset ticket",
        description: "Cannot link retired equipment.",
        category: "HARDWARE",
        assetId: created.id,
      }),
    ).rejects.toMatchObject({ status: 422 });
  });
  it("rolls back an asset update if activity cannot be written", async () => {
    const created = await createAsset(admin, assetInput);
    const failure = vi
      .spyOn(AssetHistory, "create")
      .mockRejectedValueOnce(new Error("Asset history unavailable"));
    try {
      await expect(
        updateAsset(
          admin,
          created.id,
          { version: 0, assignedUserId: employee.id },
          true,
        ),
      ).rejects.toThrow("Asset history");
    } finally {
      failure.mockRestore();
    }
    expect((await Asset.findById(created.id).lean())!.version).toBe(0);
    expect(
      (await Asset.findById(created.id).lean())!.assignedUserId,
    ).toBeNull();
  });
  it("provisions normalized unique users without disclosing hashes and enforces administrator scope", async () => {
    const input = {
      name: "Casey Singh",
      email: " Casey@techdesk.example ",
      role: "TECHNICIAN",
      password: "Fictional-unique-password",
    };
    await expect(createUser(technician, input)).rejects.toMatchObject({
      status: 403,
    });
    const created = await createUser(admin, input);
    expect(created.email).toBe("casey@techdesk.example");
    expect(created).not.toHaveProperty("passwordHash");
    await expect(createUser(admin, input)).rejects.toMatchObject({
      code: 11000,
    });
    expect(JSON.stringify(await listUsers(admin, {}))).not.toContain(
      "passwordHash",
    );
    await expect(
      listUsers({ ...employee, role: "ADMIN" }, {}),
    ).rejects.toMatchObject({ status: 403 });
    await updateUser(admin, created.id, {
      version: 0,
      role: "TECHNICIAN",
      isActive: false,
    });
    await expect(
      updateAsset(
        admin,
        demoIds.laptop,
        { version: 0, assignedUserId: created.id },
        true,
      ),
    ).rejects.toMatchObject({ status: 422 });
    await expect(
      listTickets({ ...technician, id: created.id }, {}),
    ).rejects.toMatchObject({ status: 401 });
  });
  it("blocks deactivation with live ticket or equipment assignments and protects the final administrator", async () => {
    await expect(
      updateUser(admin, admin.id, {
        version: 0,
        role: "EMPLOYEE",
        isActive: true,
      }),
    ).rejects.toMatchObject({ code: "LAST_ADMIN" });
    await expect(
      updateUser(admin, employee.id, {
        version: 0,
        role: "EMPLOYEE",
        isActive: false,
      }),
    ).rejects.toMatchObject({ code: "ASSIGNED_ASSETS" });
    await change(technician, "CLAIM");
    await expect(
      updateUser(admin, technician.id, {
        version: 0,
        role: "TECHNICIAN",
        isActive: false,
      }),
    ).rejects.toMatchObject({ code: "ACTIVE_ASSIGNMENTS" });
    await expect(
      updateUser(admin, technician.id, {
        version: 0,
        role: "EMPLOYEE",
        isActive: true,
      }),
    ).rejects.toMatchObject({ code: "ACTIVE_ASSIGNMENTS" });
    await change(admin, "ASSIGN", { assignedToId: admin.id });
    await updateUser(admin, technician.id, {
      version: 0,
      role: "EMPLOYEE",
      isActive: true,
    });
    await expect(
      change(technician, "PRIORITY", { priority: "HIGH" }),
    ).rejects.toMatchObject({ status: 404 });
  });
  it("prevents simultaneous admin removals from leaving zero active administrators", async () => {
    const second = await createUser(admin, {
      name: "Second Admin",
      email: "second-admin@techdesk.example",
      role: "ADMIN",
      password: "Fictional-unique-password",
    });
    const outcomes = await Promise.allSettled([
      updateUser(admin, admin.id, {
        version: 0,
        role: "EMPLOYEE",
        isActive: true,
      }),
      updateUser({ ...admin, id: second.id }, second.id, {
        version: 0,
        role: "EMPLOYEE",
        isActive: true,
      }),
    ]);
    expect(outcomes.filter((o) => o.status === "fulfilled")).toHaveLength(1);
    expect(await User.countDocuments({ role: "ADMIN", isActive: true })).toBe(
      1,
    );
  });
  it("serializes assignment and deactivation so inactive staff never receive active tickets", async () => {
    const outcomes = await Promise.allSettled([
      change(admin, "ASSIGN", { assignedToId: technician.id }),
      updateUser(admin, technician.id, {
        version: 0,
        role: "TECHNICIAN",
        isActive: false,
      }),
    ]);
    expect(outcomes.filter((o) => o.status === "fulfilled")).toHaveLength(1);
    const user = await User.findById(technician.id).lean(),
      ticket = await Ticket.findById(demoIds.ticket).lean();
    expect(user!.isActive || ticket!.assignedToId !== technician.id).toBe(true);
  });
});

describe("phase 6 deterministic reporting", () => {
  it("includes exact reporting boundaries and excludes older and future resolutions", async () => {
    await Ticket.deleteMany({});
    const now = new Date("2026-10-09T12:00:00Z");
    const start = new Date("2026-09-09T12:00:00Z");
    await Ticket.insertMany(
      [
        start,
        now,
        new Date(start.getTime() - 1),
        new Date(now.getTime() + 1),
      ].map((resolvedAt, i) => ({
        _id: randomUUID(),
        number: `BOUNDARY-${i}`,
        title: "Boundary fixture",
        description: "Fictional reporting fixture",
        category: "OTHER",
        createdById: employee.id,
        status: "RESOLVED",
        createdAt: new Date(resolvedAt.getTime() - 3600000),
        resolvedAt,
      })),
    );
    const stats = await dashboardStats(employee, now);
    expect(stats.resolvedInWindow).toBe(2);
    expect(stats.averageResolutionHours).toBe(1);
  });
  it("matches explicit date cohorts, current workload, reopened exclusions, and role scopes", async () => {
    await Ticket.deleteMany({});
    const now = new Date("2026-10-09T12:00:00Z"),
      createdAt = new Date("2026-10-01T12:00:00Z");
    await Ticket.insertMany([
      {
        _id: randomUUID(),
        number: "METRIC-1",
        title: "Hardware",
        description: "Fixture",
        category: "HARDWARE",
        createdById: employee.id,
        status: "OPEN",
        createdAt,
      },
      {
        _id: randomUUID(),
        number: "METRIC-2",
        title: "Network",
        description: "Fixture",
        category: "NETWORK",
        createdById: other.id,
        status: "IN_PROGRESS",
        assignedToId: technician.id,
        createdAt: new Date("2026-01-01T00:00:00Z"),
      },
      {
        _id: randomUUID(),
        number: "METRIC-3",
        title: "Resolved",
        description: "Fixture",
        category: "SOFTWARE",
        createdById: employee.id,
        status: "RESOLVED",
        assignedToId: technician.id,
        createdAt,
        resolvedAt: new Date("2026-10-01T14:00:00Z"),
      },
      {
        _id: randomUUID(),
        number: "METRIC-4",
        title: "Closed",
        description: "Fixture",
        category: "NETWORK",
        createdById: other.id,
        status: "CLOSED",
        assignedToId: admin.id,
        createdAt,
        resolvedAt: new Date("2026-10-01T18:00:00Z"),
      },
      {
        _id: randomUUID(),
        number: "METRIC-5",
        title: "Reopened",
        description: "Fixture",
        category: "OTHER",
        createdById: employee.id,
        status: "ASSIGNED",
        assignedToId: technician.id,
        createdAt,
        resolvedAt: null,
      },
      {
        _id: randomUUID(),
        number: "METRIC-6",
        title: "Outside",
        description: "Fixture",
        category: "ACCESS",
        createdById: other.id,
        status: "RESOLVED",
        createdAt: new Date("2026-01-01T00:00:00Z"),
        resolvedAt: new Date("2026-08-01T00:00:00Z"),
      },
    ]);
    const stats = await dashboardStats(admin, now);
    expect(stats.current).toEqual({
      open: 1,
      assigned: 1,
      inProgress: 1,
      active: 3,
    });
    expect(stats.createdInWindow).toBe(4);
    expect(stats.resolvedInWindow).toBe(2);
    expect(stats.averageResolutionHours).toBe(4);
    expect(stats.categories).toEqual([
      { category: "HARDWARE", count: 1 },
      { category: "SOFTWARE", count: 1 },
      { category: "NETWORK", count: 1 },
      { category: "ACCESS", count: 0 },
      { category: "OTHER", count: 1 },
    ]);
    expect(stats.workload.find((w) => w.id === technician.id)!.count).toBe(2);
    expect(stats.workload.find((w) => w.id === "unassigned")!.count).toBe(1);
    const own = await dashboardStats(employee, now);
    expect(own.current.active).toBe(2);
    expect(own.resolvedInWindow).toBe(1);
    expect(own.averageResolutionHours).toBe(2);
    expect(own.categories).toEqual([]);
    expect(own.workload).toEqual([]);
    const tech = await dashboardStats(technician, now);
    expect(tech.current.active).toBe(3);
    expect(tech.workload).toEqual([
      { id: technician.id, name: "Assigned to you", count: 2 },
    ]);
    expect(tech.categories).toEqual([]);
    expect(tech.averageResolutionHours).toBeNull();
  });
  it("returns zero counts and no invented average for an empty dataset", async () => {
    await Ticket.deleteMany({});
    const stats = await dashboardStats(admin);
    expect(stats.current.active).toBe(0);
    expect(stats.resolvedInWindow).toBe(0);
    expect(stats.averageResolutionHours).toBeNull();
    expect(stats.categories.every((c) => c.count === 0)).toBe(true);
    expect(stats.recent).toEqual([]);
  });
});
