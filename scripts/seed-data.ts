import { hash } from "bcryptjs";
import type { ClientSession } from "mongoose";
import {
  User,
  Asset,
  Ticket,
  Comment,
  TicketHistory,
  ensureIndexes,
} from "../src/models";
export const demoIds = {
  employee: "11111111-1111-4111-8111-111111111111",
  otherEmployee: "22222222-2222-4222-8222-222222222222",
  technician: "33333333-3333-4333-8333-333333333333",
  admin: "44444444-4444-4444-8444-444444444444",
  laptop: "55555555-5555-4555-8555-555555555555",
  otherLaptop: "66666666-6666-4666-8666-666666666666",
  ticket: "77777777-7777-4777-8777-777777777777",
  otherTicket: "88888888-8888-4888-8888-888888888888",
};
export async function seedData(password: string, session?: ClientSession) {
  if (password.length < 12 || Buffer.byteLength(password, "utf8") > 72)
    throw new Error(
      "DEMO_PASSWORD must have at least 12 characters and at most 72 UTF-8 bytes.",
    );
  if (!session) await ensureIndexes();
  const passwordHash = await hash(password, 12);
  const users = [
    {
      _id: demoIds.employee,
      email: "employee@techdesk.example",
      name: "Alex Morgan",
      role: "EMPLOYEE",
    },
    {
      _id: demoIds.otherEmployee,
      email: "employee2@techdesk.example",
      name: "Jamie Chen",
      role: "EMPLOYEE",
    },
    {
      _id: demoIds.technician,
      email: "technician@techdesk.example",
      name: "Sam Rivera",
      role: "TECHNICIAN",
    },
    {
      _id: demoIds.admin,
      email: "admin@techdesk.example",
      name: "Taylor Brooks",
      role: "ADMIN",
    },
  ];
  for (const user of users)
    await User.updateOne(
      { _id: user._id },
      { $setOnInsert: { ...user, passwordHash, isActive: true, version: 0 } },
      { upsert: true, session },
    );
  for (const asset of [
    {
      _id: demoIds.laptop,
      assetTag: "TD-LAP-001",
      assignedUserId: demoIds.employee,
      model: "ThinkPad T14",
    },
    {
      _id: demoIds.otherLaptop,
      assetTag: "TD-LAP-002",
      assignedUserId: demoIds.otherEmployee,
      model: "ThinkPad T16",
    },
  ])
    await Asset.updateOne(
      { _id: asset._id },
      {
        $setOnInsert: {
          ...asset,
          type: "LAPTOP",
          manufacturer: "Lenovo",
          location: "Demo office",
          status: "ASSIGNED",
          notes: "Fictional staff-only inventory note",
          version: 0,
        },
      },
      { upsert: true, session },
    );
  for (const ticket of [
    {
      _id: demoIds.ticket,
      number: "TD-DEMO000001",
      title: "Laptop cannot connect to office Wi-Fi",
      description:
        "My assigned laptop cannot connect to the fictional office wireless network. Restarting has not helped.",
      createdById: demoIds.employee,
      assetId: demoIds.laptop,
      category: "NETWORK",
    },
    {
      _id: demoIds.otherTicket,
      number: "TD-DEMO000002",
      title: "Second employee software installation request",
      description:
        "Please help install the approved development tools on my fictional laptop.",
      createdById: demoIds.otherEmployee,
      assetId: demoIds.otherLaptop,
      category: "SOFTWARE",
    },
  ]) {
    await Ticket.updateOne(
      { _id: ticket._id },
      {
        $setOnInsert: {
          ...ticket,
          priority: "MEDIUM",
          status: "OPEN",
          assignedToId: null,
          version: 0,
        },
      },
      { upsert: true, session },
    );
    await TicketHistory.updateOne(
      { ticketId: ticket._id, eventType: "CREATED" },
      {
        $setOnInsert: {
          ticketId: ticket._id,
          actorId: ticket.createdById,
          eventType: "CREATED",
          visibility: "PUBLIC",
          newValue: "OPEN",
        },
      },
      { upsert: true, session },
    );
  }
  await Comment.updateOne(
    { _id: "99999999-9999-4999-8999-999999999999" },
    {
      $setOnInsert: {
        ticketId: demoIds.ticket,
        authorId: demoIds.technician,
        message:
          "Fictional private diagnostic note. Employees must never receive this.",
        isInternal: true,
      },
    },
    { upsert: true, session },
  );
  await TicketHistory.updateOne(
    { ticketId: demoIds.ticket, eventType: "INTERNAL_COMMENT" },
    {
      $setOnInsert: {
        ticketId: demoIds.ticket,
        actorId: demoIds.technician,
        eventType: "INTERNAL_COMMENT",
        visibility: "INTERNAL",
      },
    },
    { upsert: true, session },
  );
}
