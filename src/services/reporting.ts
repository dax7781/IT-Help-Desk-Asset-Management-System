import { connectDb } from "@/lib/db";
import { activeActor } from "@/lib/workflow";
import { Ticket, User } from "@/models";
import { ticketScope, type Actor } from "@/lib/permissions";
import { categories } from "@/lib/constants";
const activeStatuses = ["OPEN", "ASSIGNED", "IN_PROGRESS"];
export async function dashboardStats(actor: Actor, now = new Date()) {
  await connectDb();
  actor = await activeActor(actor);
  const start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const [result] = await Ticket.aggregate<{
    statuses: { _id: string; count: number }[];
    created: { count: number }[];
    resolved: { count: number; averageMs: number }[];
    categories: { _id: string; count: number }[];
    workload: { _id: string | null; count: number }[];
  }>([
    { $match: ticketScope(actor) },
    {
      $facet: {
        statuses: [{ $group: { _id: "$status", count: { $sum: 1 } } }],
        created: [
          { $match: { createdAt: { $gte: start, $lte: now } } },
          { $count: "count" },
        ],
        resolved: [
          {
            $match: {
              status: { $in: ["RESOLVED", "CLOSED"] },
              resolvedAt: { $gte: start, $lte: now },
            },
          },
          {
            $group: {
              _id: null,
              count: { $sum: 1 },
              averageMs: { $avg: { $subtract: ["$resolvedAt", "$createdAt"] } },
            },
          },
        ],
        categories: [
          { $match: { createdAt: { $gte: start, $lte: now } } },
          { $group: { _id: "$category", count: { $sum: 1 } } },
        ],
        workload: [
          {
            $match: {
              status: { $in: activeStatuses },
              ...(actor.role === "TECHNICIAN"
                ? { assignedToId: actor.id }
                : {}),
            },
          },
          { $group: { _id: "$assignedToId", count: { $sum: 1 } } },
        ],
      },
    },
  ]);
  const count = (status: string) =>
    result.statuses.find((s) => s._id === status)?.count || 0;
  const recent = await Ticket.find(ticketScope(actor))
    .select("_id number title status priority createdAt")
    .sort({ createdAt: -1, _id: 1 })
    .limit(5)
    .lean();
  const staff =
    actor.role === "ADMIN"
      ? await User.find({
          isActive: true,
          role: { $in: ["TECHNICIAN", "ADMIN"] },
        })
          .select("_id name")
          .sort({ name: 1, _id: 1 })
          .lean()
      : [];
  return {
    scope:
      actor.role === "EMPLOYEE"
        ? "Your tickets"
        : actor.role === "TECHNICIAN"
          ? "Support queue"
          : "Organization",
    window: { start: start.toISOString(), end: now.toISOString() },
    current: {
      open: count("OPEN"),
      assigned: count("ASSIGNED"),
      inProgress: count("IN_PROGRESS"),
      active: activeStatuses.reduce((sum, s) => sum + count(s), 0),
    },
    createdInWindow: result.created[0]?.count || 0,
    resolvedInWindow: result.resolved[0]?.count || 0,
    averageResolutionHours:
      actor.role === "TECHNICIAN"
        ? null
        : result.resolved[0]
          ? result.resolved[0].averageMs / 3600000
          : null,
    categories:
      actor.role === "ADMIN"
        ? categories.map((category) => ({
            category,
            count:
              result.categories.find((c) => c._id === category)?.count || 0,
          }))
        : [],
    workload:
      actor.role === "ADMIN"
        ? [
            {
              id: "unassigned",
              name: "Unassigned",
              count: result.workload.find((w) => w._id === null)?.count || 0,
            },
            ...staff.map((u) => ({
              id: u._id,
              name: u.name,
              count: result.workload.find((w) => w._id === u._id)?.count || 0,
            })),
          ]
        : actor.role === "TECHNICIAN"
          ? [
              {
                id: actor.id,
                name: "Assigned to you",
                count:
                  result.workload.find((w) => w._id === actor.id)?.count || 0,
              },
            ]
          : [],
    recent: recent.map((t) => ({
      id: t._id,
      number: t.number,
      title: t.title,
      status: t.status,
      priority: t.priority,
      createdAt: t.createdAt.toISOString(),
    })),
  };
}
