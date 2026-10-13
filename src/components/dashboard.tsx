import Link from "next/link";
import {
  ArrowUpRight,
  Ticket,
  Clock,
  CheckCircle2,
  Inbox,
  Laptop,
} from "lucide-react";
import type { Actor } from "@/lib/permissions";
import type { dashboardStats } from "@/services/reporting";
import { label } from "@/lib/constants";
import StatusBadge from "@/components/status-badge";
import CategoryChart from "@/components/category-chart";
type Stats = Awaited<ReturnType<typeof dashboardStats>>;
function date(value: string) {
  return new Date(value).toLocaleString("en-US", {
    timeZone: "UTC",
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}
export default function Dashboard({
  user,
  data,
}: {
  user: Actor;
  data: Stats;
}) {
  const metrics = [
    {
      title: "Active tickets",
      value: data.current.active,
      caption: "Current snapshot · all creation dates",
      Icon: Ticket,
    },
    {
      title: "Awaiting assignment",
      value: data.current.open,
      caption: "Current Open tickets",
      Icon: Inbox,
    },
    {
      title: "In progress",
      value: data.current.inProgress,
      caption: `${data.current.assigned} assigned, awaiting work`,
      Icon: Clock,
    },
    {
      title: "Resolved in 30 days",
      value: data.resolvedInWindow,
      caption: "Currently Resolved or Closed",
      Icon: CheckCircle2,
    },
  ];
  return (
    <>
      <div className="page-heading">
        <div>
          <p className="eyebrow">{data.scope} / Service desk</p>
          <h1>Service overview</h1>
          <p className="muted">
            {user.role === "EMPLOYEE"
              ? `Welcome back, ${user.name.split(" ")[0]}. Track your requests and find support.`
              : `Welcome back, ${user.name.split(" ")[0]}. Here is the work ahead.`}
          </p>
        </div>
        <Link className="button primary" href="/tickets/new">
          New ticket <ArrowUpRight size={16} aria-hidden="true" />
        </Link>
      </div>
      <section className="work-focus" aria-labelledby="work-focus-title">
        <div className="work-focus-intro">
          <span className="work-focus-icon">
            <Inbox size={22} aria-hidden="true" />
          </span>
          <div>
            <h2 id="work-focus-title">
              {user.role === "EMPLOYEE"
                ? "Your support at a glance"
                : "Pick up where work needs you"}
            </h2>
            <p>Open a focused view to get started.</p>
          </div>
        </div>
        <div className="queue-shortcuts">
          <Link href="/tickets?status=OPEN">
            <strong>{data.current.open.toLocaleString("en-US")}</strong>
            <span>
              {user.role === "EMPLOYEE"
                ? "Awaiting assignment"
                : "Unassigned queue"}
            </span>
            <ArrowUpRight size={16} aria-hidden="true" />
          </Link>
          <Link
            href={
              user.role === "EMPLOYEE"
                ? "/tickets?status=IN_PROGRESS"
                : "/tickets?assignee=mine"
            }
          >
            <strong>
              {(user.role === "EMPLOYEE"
                ? data.current.inProgress
                : data.workload.find((w) => w.id === user.id)?.count || 0
              ).toLocaleString("en-US")}
              <small>active</small>
            </strong>
            <span>
              {user.role === "EMPLOYEE"
                ? "Work in progress"
                : "Assigned to you"}
            </span>
            <ArrowUpRight size={16} aria-hidden="true" />
          </Link>
          <Link href="/assets">
            <Laptop size={22} aria-hidden="true" />
            <span>
              {user.role === "EMPLOYEE"
                ? "Your equipment"
                : "Equipment inventory"}
            </span>
            <ArrowUpRight size={16} aria-hidden="true" />
          </Link>
        </div>
      </section>
      <div className="metric-grid">
        {metrics.map(({ title, value, caption, Icon }) => (
          <article key={title} className="metric">
            <span className="metric-label">
              {title}
              <Icon size={18} aria-hidden="true" />
            </span>
            <strong>{new Intl.NumberFormat("en-US").format(value)}</strong>
            <p>{caption}</p>
          </article>
        ))}
      </div>
      <div className="report-window">
        <p>
          <strong>{data.scope}</strong> · {data.createdInWindow} tickets created
          in the trailing 30 days
        </p>
        <p className="small muted">
          {date(data.window.start)} to {date(data.window.end)} UTC. Status and
          workload counts show the current snapshot.
        </p>
      </div>
      <div className="analytics-grid">
        <section className="panel">
          <div className="section-heading inline">
            <h2>Recent requests</h2>
            <Link href="/tickets" className="text-link">
              View all tickets →
            </Link>
          </div>
          {data.recent.length ? (
            <ul className="record-list">
              {data.recent.map((t) => (
                <li key={t.id}>
                  <Link href={`/tickets/${t.id}`}>
                    <strong>{t.title}</strong>
                    <small>
                      {t.number} · {label(t.priority)} priority
                    </small>
                  </Link>
                  <StatusBadge status={t.status} />
                </li>
              ))}
            </ul>
          ) : (
            <div className="empty-state">
              <h3>No requests yet</h3>
              <p className="muted">Create a ticket when you need IT support.</p>
              <Link className="button primary" href="/tickets/new">
                Submit a ticket
              </Link>
            </div>
          )}
        </section>
        <section className="panel">
          <h2>
            {user.role === "TECHNICIAN" ? "Your workload" : "Resolution time"}
          </h2>
          {user.role === "TECHNICIAN" ? (
            <>
              <p className="report-number">
                {data.workload[0]?.count || 0}
                <small> active tickets assigned to you</small>
              </p>
              <Link className="text-link" href="/tickets?assignee=mine">
                View your assigned tickets →
              </Link>
            </>
          ) : (
            <>
              <p className="report-number">
                {data.averageResolutionHours === null
                  ? "—"
                  : data.averageResolutionHours < 0.1
                    ? "<0.1"
                    : new Intl.NumberFormat("en-US", {
                        maximumFractionDigits: 1,
                      }).format(data.averageResolutionHours)}
                <small>
                  {data.averageResolutionHours === null
                    ? "No resolved tickets in this period"
                    : " hours average"}
                </small>
              </p>
              <p className="muted small">
                Elapsed time from creation to the latest resolution for
                currently resolved or closed tickets resolved within 30 days.
                Includes time spent reopened.
              </p>
            </>
          )}
          <div className="dashboard-links">
            <Link href="/assets">
              {user.role === "EMPLOYEE"
                ? "View your equipment"
                : "Open equipment inventory"}{" "}
              →
            </Link>
            {user.role === "ADMIN" && (
              <Link href="/admin/users">Manage users →</Link>
            )}
          </div>
        </section>
      </div>
      {user.role === "ADMIN" && (
        <div className="analytics-grid section-heading">
          <section className="panel">
            <h2>Requests by category</h2>
            <p className="muted small">
              Tickets created in the trailing 30 days.
            </p>
            <CategoryChart data={data.categories} />
            <table className="compact-table">
              <caption className="sr-only">
                Requests by category, trailing 30 days
              </caption>
              <thead>
                <tr>
                  <th scope="col">Category</th>
                  <th scope="col">Tickets</th>
                </tr>
              </thead>
              <tbody>
                {data.categories.map((c) => (
                  <tr key={c.category}>
                    <th scope="row">{label(c.category)}</th>
                    <td>{c.count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
          <section className="panel">
            <h2>Support workload</h2>
            <p className="muted small">
              Current active tickets by assignee. Includes unassigned work.
            </p>
            <table className="compact-table">
              <caption className="sr-only">
                Current active support workload
              </caption>
              <thead>
                <tr>
                  <th scope="col">Assignee</th>
                  <th scope="col">Active tickets</th>
                </tr>
              </thead>
              <tbody>
                {data.workload.map((w) => (
                  <tr key={w.id}>
                    <th scope="row">
                      <Link
                        className="text-link"
                        href={`/tickets?assignee=${w.id}`}
                      >
                        {w.name}
                      </Link>
                    </th>
                    <td>{w.count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        </div>
      )}
    </>
  );
}
