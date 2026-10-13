import Link from "next/link";
import {
  ArrowUpRight,
  Search,
  Ticket as TicketIcon,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { requirePageUser as requireUser } from "@/lib/current-user";
import { listTickets } from "@/services/tickets";
import { isStaff } from "@/lib/permissions";
import { categories, priorities, statuses, label } from "@/lib/constants";
import StatusBadge from "@/components/status-badge";
import TicketViews from "@/components/ticket-views";
export default async function TicketsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await requireUser(),
    raw = await searchParams;
  const query: Record<string, string> = {};
  for (const key of [
    "search",
    "status",
    "priority",
    "category",
    "page",
    ...(isStaff(user) ? ["assignee"] : []),
  ])
    if (typeof raw[key] === "string" && raw[key])
      query[key] = raw[key] as string;
  const data = await listTickets(user, query);
  function pageUrl(page: number) {
    const params = new URLSearchParams(query);
    params.set("page", String(page));
    return "/tickets?" + params;
  }
  return (
    <>
      <div className="page-heading">
        <div>
          <p className="eyebrow">Service desk / Requests</p>
          <h1>
            {isStaff(user) ? "Tickets" : "My tickets"}{" "}
            <span className="heading-count">{data.total}</span>
          </h1>
          <p className="muted">
            {isStaff(user)
              ? "Claim requests, coordinate support, and track progress."
              : "A clear view of your requests and updates."}
          </p>
        </div>
        <Link href="/tickets/new" className="button primary">
          New ticket <ArrowUpRight size={17} aria-hidden="true" />
        </Link>
      </div>
      <section className="panel ticket-list">
        <TicketViews role={user.role} query={query} />
        <form className="filters" method="GET">
          <div className="search-input">
            <Search size={17} aria-hidden="true" />
            <input
              name="search"
              aria-label="Search tickets"
              placeholder="Search by title or ticket number…"
              defaultValue={query.search}
              maxLength={150}
              autoComplete="off"
            />
          </div>
          <select
            name="status"
            aria-label="Status"
            defaultValue={query.status || ""}
          >
            <option value="">All statuses</option>
            {statuses.map((s) => (
              <option key={s} value={s}>
                {label(s)}
              </option>
            ))}
          </select>
          <select
            name="priority"
            aria-label="Priority"
            defaultValue={query.priority || ""}
          >
            <option value="">All priorities</option>
            {priorities.map((s) => (
              <option key={s} value={s}>
                {label(s)}
              </option>
            ))}
          </select>
          <select
            name="category"
            aria-label="Category"
            defaultValue={query.category || ""}
          >
            <option value="">All categories</option>
            {categories.map((s) => (
              <option key={s} value={s}>
                {label(s)}
              </option>
            ))}
          </select>
          {isStaff(user) && (
            <select
              name="assignee"
              aria-label="Assignment filter"
              defaultValue={query.assignee || ""}
            >
              <option value="">All assignments</option>
              <option value="mine">Assigned to me</option>
              <option value="unassigned">Unassigned</option>
              {query.assignee &&
                !["mine", "unassigned"].includes(query.assignee) && (
                  <option value={query.assignee}>Selected staff member</option>
                )}
            </select>
          )}
          <button className="button secondary">Filter</button>
          {Object.keys(query).length > 0 && (
            <Link href="/tickets" className="text-link">
              Clear
            </Link>
          )}
        </form>
        <div className="list-summary">
          <span>
            {data.total.toLocaleString("en-US")} matching{" "}
            {data.total === 1 ? "request" : "requests"}
          </span>
          <span>
            Newest first ·{" "}
            {isStaff(user) ? "Support queue" : "Your requests only"}
          </span>
        </div>
        {data.items.length ? (
          <>
            <div className="table-scroll">
              <table className="ticket-table" role="table">
                <thead>
                  <tr>
                    <th scope="col">Ticket</th>
                    <th scope="col">Status</th>
                    <th scope="col">Priority</th>
                    <th scope="col">Category</th>
                    <th scope="col">Created</th>
                  </tr>
                </thead>
                <tbody>
                  {data.items.map((t) => (
                    <tr key={t.id}>
                      <td data-label="Ticket">
                        <Link
                          href={"/tickets/" + t.id}
                          className="ticket-title"
                        >
                          {t.title}
                        </Link>
                        <span className="ticket-number">{t.number}</span>
                      </td>
                      <td data-label="Status">
                        <StatusBadge status={t.status} />
                      </td>
                      <td data-label="Priority">
                        <span
                          className={
                            "priority priority-" + t.priority.toLowerCase()
                          }
                        >
                          <i />
                          {label(t.priority)}
                        </span>
                      </td>
                      <td data-label="Category">{label(t.category)}</td>
                      <td className="date-cell" data-label="Created">
                        {new Date(t.createdAt).toLocaleDateString("en-US", {
                          timeZone: "America/New_York",
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="pagination">
              <span>
                {data.total} {data.total === 1 ? "ticket" : "tickets"} · Page{" "}
                {data.page} of {Math.max(1, data.pages)}
              </span>
              <div>
                {data.page > 1 && (
                  <Link
                    className="button secondary"
                    href={pageUrl(data.page - 1)}
                  >
                    <ChevronLeft size={15} /> Previous
                  </Link>
                )}
                {data.page < data.pages && (
                  <Link
                    className="button secondary"
                    href={pageUrl(data.page + 1)}
                  >
                    Next <ChevronRight size={15} />
                  </Link>
                )}
              </div>
            </div>
          </>
        ) : (
          <div className="empty-state">
            <span className="feature-icon">
              <TicketIcon size={25} />
            </span>
            <h2>
              {Object.keys(query).length
                ? "No matching tickets"
                : "No tickets yet"}
            </h2>
            <p className="muted">
              {Object.keys(query).length
                ? "Try changing or clearing your filters."
                : "When something needs attention, your first ticket starts here."}
            </p>
            <Link
              href={Object.keys(query).length ? "/tickets" : "/tickets/new"}
              className="button primary"
            >
              {Object.keys(query).length ? "Clear filters" : "Create a ticket"}
            </Link>
          </div>
        )}
      </section>
    </>
  );
}
