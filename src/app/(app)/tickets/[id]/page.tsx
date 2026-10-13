import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Clock, Laptop, MessageSquare } from "lucide-react";
import { requirePageUser as requireUser } from "@/lib/current-user";
import { ticketDetail } from "@/services/tickets";
import { AppError } from "@/lib/errors";
import { label } from "@/lib/constants";
import StatusBadge from "@/components/status-badge";
import CommentForm from "@/components/comment-form";
import TicketControls from "@/components/ticket-controls";
import TicketInteractions from "@/components/ticket-interactions";
import TicketStage from "@/components/ticket-stage";
import { selectableUsers } from "@/services/users";
import { isStaff } from "@/lib/permissions";
function prettyValue(value: string) {
  return value.replace(
    /\b(OPEN|ASSIGNED|IN_PROGRESS|RESOLVED|CLOSED|LOW|MEDIUM|HIGH|CRITICAL)\b/g,
    (token) => label(token),
  );
}
function date(value: string) {
  return new Date(value).toLocaleString("en-US", {
    timeZone: "America/New_York",
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}
export default async function TicketPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ created?: string }>;
}) {
  const user = await requireUser(),
    { id } = await params;
  let ticket;
  try {
    ticket = await ticketDetail(user, id);
  } catch (error) {
    if (error instanceof AppError && error.status === 404) notFound();
    throw error;
  }
  const created =
    (await searchParams).created === "1" && ticket.createdById === user.id;
  const people = user.role === "ADMIN" ? await selectableUsers(user) : [];
  return (
    <>
      <Link href="/tickets" className="back-link">
        <ArrowLeft size={16} /> Back to tickets
      </Link>
      {created && (
        <p className="success" role="status">
          Your ticket has been submitted.
        </p>
      )}
      <div className="page-heading detail-heading">
        <div>
          <p className="eyebrow">{ticket.number}</p>
          <h1>{ticket.title}</h1>
          <p className="muted">
            Submitted by {ticket.requester} · {date(ticket.createdAt)} ET
          </p>
        </div>
        <StatusBadge status={ticket.status} />
      </div>
      <dl className="record-summary" aria-label="Request summary">
        <div>
          <dt>Priority</dt>
          <dd>{label(ticket.priority)}</dd>
        </div>
        <div>
          <dt>Category</dt>
          <dd>{label(ticket.category)}</dd>
        </div>
        <div>
          <dt>Assigned to</dt>
          <dd>{ticket.assignee || "Unassigned"}</dd>
        </div>
        <div>
          <dt>Last updated</dt>
          <dd>{date(ticket.updatedAt)} ET</dd>
        </div>
      </dl>
      <TicketStage status={ticket.status} />
      <TicketInteractions>
        <div className="detail-grid">
          <div>
            <section className="panel detail-panel">
              <h2>Issue description</h2>
              <p className="preserve-text">{ticket.description}</p>
              {ticket.resolutionSummary && (
                <>
                  <h3>Resolution</h3>
                  <p className="preserve-text">{ticket.resolutionSummary}</p>
                </>
              )}
            </section>
            <section className="panel detail-panel">
              <div className="section-heading inline">
                <h2>
                  <MessageSquare size={19} /> Conversation
                </h2>
              </div>
              {ticket.comments.length ? (
                ticket.comments.map((c) => (
                  <article
                    className={"comment " + (c.isInternal ? "internal" : "")}
                    key={c.id}
                  >
                    <div className="comment-meta">
                      <strong>{c.author}</strong>
                      {c.isInternal && (
                        <span className="pill neutral">Internal</span>
                      )}
                      <time dateTime={c.createdAt}>{date(c.createdAt)} ET</time>
                    </div>
                    <p className="preserve-text">{c.message}</p>
                  </article>
                ))
              ) : (
                <p className="muted conversation-empty">
                  No public updates yet. Add more details below.
                </p>
              )}
              <CommentForm ticketId={id} staff={isStaff(user)} />
            </section>
          </div>
          <aside>
            <TicketControls ticket={ticket} user={user} people={people} />
            <section className="panel detail-panel">
              <h2>Ticket details</h2>
              <dl className="metadata">
                <div>
                  <dt>Priority</dt>
                  <dd>
                    <span
                      className={
                        "priority priority-" + ticket.priority.toLowerCase()
                      }
                    >
                      <i />
                      {label(ticket.priority)}
                    </span>
                  </dd>
                </div>
                <div>
                  <dt>Category</dt>
                  <dd>{label(ticket.category)}</dd>
                </div>
                <div>
                  <dt>Assigned to</dt>
                  <dd>{ticket.assignee || "Not assigned yet"}</dd>
                </div>
              </dl>
              {ticket.asset && (
                <div className="asset-card">
                  <Laptop size={20} />
                  <div>
                    <strong>
                      {ticket.asset.canViewDetails ? (
                        <Link href={"/assets/" + ticket.asset.id}>
                          {ticket.asset.assetTag}
                        </Link>
                      ) : (
                        ticket.asset.assetTag
                      )}
                    </strong>
                    <p>
                      {ticket.asset.manufacturer} {ticket.asset.model}
                    </p>
                  </div>
                </div>
              )}
            </section>
            <section className="panel detail-panel">
              <h2>
                <Clock size={18} /> Activity
              </h2>
              <ol className="timeline">
                {ticket.history.map((h) => (
                  <li key={h.id}>
                    <strong>
                      {h.eventType === "CREATED"
                        ? "Ticket created"
                        : h.eventType === "PUBLIC_COMMENT"
                          ? "Public comment added"
                          : label(h.eventType)}
                    </strong>
                    <span>{h.actor}</span>
                    {h.newValue && (
                      <span className="preserve-text">
                        {h.oldValue ? `${prettyValue(h.oldValue)} → ` : ""}
                        {prettyValue(h.newValue)}
                      </span>
                    )}
                    <time dateTime={h.createdAt}>{date(h.createdAt)} ET</time>
                  </li>
                ))}
              </ol>
            </section>
          </aside>
        </div>
      </TicketInteractions>
    </>
  );
}
