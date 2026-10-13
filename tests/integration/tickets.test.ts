import { beforeAll, afterAll, describe, expect, it, vi } from "vitest";
import { randomUUID } from "node:crypto";
import { MongoMemoryReplSet } from "mongodb-memory-server";
import mongoose from "mongoose";
import path from "node:path";
import { connectDb } from "@/lib/db";
import { User, Ticket, TicketHistory, Comment, Asset } from "@/models";
import {
  createTicket,
  listTickets,
  ticketDetail,
  addPublicComment,
  selectableAssets,
} from "@/services/tickets";
import { seedData, demoIds } from "../../scripts/seed-data";
import type { Actor } from "@/lib/permissions";
let replica: MongoMemoryReplSet;
const employee: Actor = {
  id: demoIds.employee,
  name: "Alex Morgan",
  email: "employee@techdesk.example",
  role: "EMPLOYEE",
};
const other: Actor = { ...employee, id: demoIds.otherEmployee };
const staff: Actor = {
  ...employee,
  id: demoIds.technician,
  role: "TECHNICIAN",
};
beforeAll(async () => {
  process.env.MONGOMS_DOWNLOAD_DIR = path.resolve(".local/binaries");
  replica = await MongoMemoryReplSet.create({
    instanceOpts: [{ launchTimeout: 60_000 }],
    replSet: { count: 1, storageEngine: "wiredTiger" },
  });
  process.env.MONGODB_URI = replica.getUri("techdesk_test");
  await connectDb();
  await seedData("Fictional-test-password-2026");
});
afterAll(async () => {
  await mongoose.disconnect();
  await replica?.stop();
});
describe("real MongoDB role boundaries and atomic history", () => {
  it("reads a coherent ticket version and conversation when a comment commits during detail loading", async () => {
    const ticket = await createTicket(employee, {
      title: "Snapshot race fixture",
      description: "Fictional coherent detail regression.",
      category: "OTHER",
    });
    const query = Comment.find({ ticketId: ticket.id, isInternal: false });
    const originalExec = query.exec.bind(query);
    const find = vi.spyOn(Comment, "find").mockReturnValueOnce(query);
    const exec = vi.spyOn(query, "exec").mockImplementationOnce(async () => {
      await addPublicComment(employee, ticket.id, {
        message: "Concurrent public update.",
      });
      return originalExec();
    });
    try {
      const snapshot = await ticketDetail(employee, ticket.id);
      expect(snapshot.version).toBe(0);
      expect(snapshot.comments).toEqual([]);
      expect(snapshot.history.map((entry) => entry.eventType)).toEqual([
        "CREATED",
      ]);
    } finally {
      find.mockRestore();
      exec.mockRestore();
    }
    const next = await ticketDetail(employee, ticket.id);
    expect(next.version).toBe(1);
    expect(next.comments[0].message).toBe("Concurrent public update.");
    await Ticket.deleteOne({ _id: ticket.id });
    await Comment.deleteMany({ ticketId: ticket.id });
    await TicketHistory.deleteMany({ ticketId: ticket.id });
  });
  it("isolates employee list/detail and hides internal content and metadata", async () => {
    const list = await listTickets(employee, {});
    expect(list.items.map((t) => t.id)).toEqual([demoIds.ticket]);
    await expect(ticketDetail(other, demoIds.ticket)).rejects.toMatchObject({
      status: 404,
    });
    const detail = await ticketDetail(employee, demoIds.ticket);
    expect(detail.comments).toEqual([]);
    expect(detail.history.map((h) => h.eventType)).toEqual(["CREATED"]);
    expect(JSON.stringify(detail)).not.toContain("private diagnostic");
    expect(JSON.stringify(detail)).not.toContain("staff-only inventory");
    expect(
      (await ticketDetail(staff, demoIds.ticket)).comments[0].isInternal,
    ).toBe(true);
  });
  it("selects only permitted assets and rejects another employee's equipment", async () => {
    expect((await selectableAssets(employee)).map((a) => a.id)).toEqual([
      demoIds.laptop,
    ]);
    await expect(
      createTicket(employee, {
        title: "Hardware issue",
        description: "A detailed issue description",
        category: "HARDWARE",
        assetId: demoIds.otherLaptop,
      }),
    ).rejects.toMatchObject({ status: 422 });
  });
  it("creates Open/Medium tickets with actor identity and public history", async () => {
    const created = await createTicket(employee, {
      title: "New Wi-Fi issue",
      description: "A detailed network issue description",
      category: "NETWORK",
      assetId: demoIds.laptop,
    });
    expect(created).toMatchObject({ status: "OPEN", priority: "MEDIUM" });
    expect((await Ticket.findById(created.id).lean())?.createdById).toBe(
      employee.id,
    );
    expect(
      await TicketHistory.countDocuments({
        ticketId: created.id,
        eventType: "CREATED",
      }),
    ).toBe(1);
  });
  it("rolls back ticket creation when history fails", async () => {
    const before = await Ticket.countDocuments();
    const failure = vi
      .spyOn(TicketHistory, "create")
      .mockRejectedValueOnce(new Error("Simulated history failure"));
    try {
      await expect(
        createTicket(employee, {
          title: "Must roll back",
          description: "History cannot be written in this case",
          category: "OTHER",
        }),
      ).rejects.toThrow("Simulated");
    } finally {
      failure.mockRestore();
    }
    expect(await Ticket.countDocuments()).toBe(before);
  });
  it("rejects unauthorized comments and writes permitted comments with history", async () => {
    await expect(
      addPublicComment(other, demoIds.ticket, { message: "Forbidden" }),
    ).rejects.toMatchObject({ status: 404 });
    await addPublicComment(employee, demoIds.ticket, {
      message: "Restart did not resolve the problem.",
    });
    expect(
      await Comment.countDocuments({
        ticketId: demoIds.ticket,
        isInternal: false,
      }),
    ).toBe(1);
    expect(
      await TicketHistory.countDocuments({
        ticketId: demoIds.ticket,
        eventType: "PUBLIC_COMMENT",
      }),
    ).toBe(1);
  });
  it("rolls back comments and ticket version when history fails", async () => {
    const before = await Comment.countDocuments();
    const version = (await Ticket.findById(demoIds.ticket).lean())?.version;
    const failure = vi
      .spyOn(TicketHistory, "create")
      .mockRejectedValueOnce(new Error("Simulated history failure"));
    try {
      await expect(
        addPublicComment(employee, demoIds.ticket, {
          message: "Must not persist.",
        }),
      ).rejects.toThrow("Simulated");
    } finally {
      failure.mockRestore();
    }
    expect(await Comment.countDocuments()).toBe(before);
    expect((await Ticket.findById(demoIds.ticket).lean())?.version).toBe(
      version,
    );
  });
  it("reads current account status and role rather than trusting caller claims", async () => {
    await expect(
      ticketDetail({ ...other, role: "ADMIN" }, demoIds.ticket),
    ).rejects.toMatchObject({ status: 404 });
    await User.updateOne({ _id: other.id }, { $set: { isActive: false } });
    await expect(listTickets(other, {})).rejects.toMatchObject({ status: 401 });
    await User.updateOne({ _id: other.id }, { $set: { isActive: true } });
  });
  it("enforces unique asset tags and escapes search regex", async () => {
    await expect(
      Asset.create({ assetTag: "TD-LAP-001", type: "LAPTOP" }),
    ).rejects.toMatchObject({ code: 11000 });
    expect((await listTickets(employee, { search: ".*" })).total).toBe(0);
  });
  it("paginates filtered results with stable tie ordering", async () => {
    await Ticket.insertMany(
      Array.from({ length: 23 }, (_, index) => ({
        _id: randomUUID(),
        number: "TD-PAGINATION-" + index,
        title: "Pagination fixture " + index,
        description: "Fictional pagination test record.",
        category: "OTHER",
        createdById: employee.id,
        createdAt: new Date("2026-01-01T00:00:00Z"),
      })),
    );
    const ids: string[] = [];
    for (let page = 1; page <= 5; page++) {
      const result = await listTickets(employee, {
        search: "Pagination fixture",
        page,
        pageSize: 5,
        category: "OTHER",
        status: "OPEN",
      });
      expect(result.total).toBe(23);
      expect(result.pages).toBe(5);
      expect(result.items.length).toBe(page === 5 ? 3 : 5);
      ids.push(...result.items.map((ticket) => ticket.id));
    }
    expect(new Set(ids).size).toBe(23);
    expect(
      (
        await listTickets(employee, {
          search: "Pagination fixture",
          pageSize: 5,
        })
      ).items.map((ticket) => ticket.id),
    ).toEqual(ids.slice(0, 5));
  });
});
