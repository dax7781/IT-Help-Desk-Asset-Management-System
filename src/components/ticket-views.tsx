import Link from "next/link";
import type { Role } from "@/lib/constants";
export default function TicketViews({
  role,
  query,
}: {
  role: Role;
  query: Record<string, string>;
}) {
  const views = [
    {
      name: role === "EMPLOYEE" ? "All my requests" : "All tickets",
      params: {},
    },
    {
      name: role === "EMPLOYEE" ? "Awaiting assignment" : "Unassigned queue",
      params: { status: "OPEN" },
    },
    ...(role !== "EMPLOYEE"
      ? [{ name: "Assigned to me", params: { assignee: "mine" } }]
      : []),
    { name: "Work in progress", params: { status: "IN_PROGRESS" } },
    { name: "Resolved requests", params: { status: "RESOLVED" } },
  ];
  const applied = Object.entries(query).filter(([key]) => key !== "page");
  return (
    <nav className="list-views" aria-label="Ticket views">
      {views.map(({ name, params }) => {
        const entries = Object.entries(params) as [string, string][];
        const selected =
          entries.length === applied.length &&
          entries.every(([key, value]) => query[key] === value);
        const search = new URLSearchParams(entries).toString();
        return (
          <Link
            key={name}
            href={"/tickets" + (search ? "?" + search : "")}
            aria-current={selected ? "page" : undefined}
          >
            {name}
          </Link>
        );
      })}
    </nav>
  );
}
