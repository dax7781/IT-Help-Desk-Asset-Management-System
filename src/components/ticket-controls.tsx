"use client";
import { useState } from "react";
import { label, priorities, type Role } from "@/lib/constants";
import {
  useMutation,
  MutationFeedback,
  useUnsavedChanges,
} from "@/components/mutation-feedback";
type Props = {
  ticket: {
    id: string;
    version: number;
    status: string;
    priority: string;
    assignedToId: string | null;
    createdById: string;
  };
  user: { id: string; role: Role };
  people: { id: string; name: string; role: Role }[];
};
export default function TicketControls({ ticket, user, people }: Props) {
  const mutation = useMutation(),
    setDirty = useUnsavedChanges();
  const staff = user.role !== "EMPLOYEE",
    admin = user.role === "ADMIN";
  const assigned = ticket.assignedToId === user.id;
  const reopen =
    ["RESOLVED", "CLOSED"].includes(ticket.status) &&
    (admin ||
      assigned ||
      (user.role === "EMPLOYEE" && ticket.createdById === user.id));
  const workAction =
    (admin || assigned) && ticket.status === "ASSIGNED"
      ? "START"
      : (admin || assigned) && ticket.status === "IN_PROGRESS"
        ? "RESOLVE"
        : (admin || assigned) && ticket.status === "RESOLVED"
          ? "CLOSE"
          : null;
  const [confirmUnassign, setConfirmUnassign] = useState(false);
  async function send(action: string, values: Record<string, unknown> = {}) {
    const endpoint = ["CLAIM", "ASSIGN"].includes(action)
      ? "/assignment"
      : action === "PRIORITY"
        ? ""
        : "/transitions";
    if (
      await mutation.send(
        `/api/tickets/${ticket.id}${endpoint}`,
        { action, version: ticket.version, ...values },
        action === "PRIORITY" ? "PATCH" : "POST",
      )
    ) {
      setDirty(false);
      setConfirmUnassign(false);
    }
  }
  if (!staff && !reopen) return null;
  return (
    <section className="panel detail-panel workflow-panel">
      <h2>{staff ? "Support actions" : "Reopen request"}</h2>
      <MutationFeedback {...mutation} />
      {staff && ticket.status === "OPEN" && !ticket.assignedToId && (
        <button
          className="button primary"
          disabled={mutation.pending}
          onClick={() => send("CLAIM")}
        >
          {mutation.pending ? "Saving…" : "Claim ticket"}
        </button>
      )}
      {admin && ["OPEN", "ASSIGNED", "IN_PROGRESS"].includes(ticket.status) && (
        <form
          className="form-stack compact-form"
          onSubmit={async (e) => {
            e.preventDefault();
            const id = String(
              new FormData(e.currentTarget).get("assignedToId") || "",
            );
            if (!id && ticket.assignedToId && !confirmUnassign) {
              setConfirmUnassign(true);
              return;
            }
            await send("ASSIGN", { assignedToId: id || null });
          }}
        >
          <label htmlFor="assignedToId">Assignment</label>
          <select
            key={ticket.assignedToId || "none"}
            id="assignedToId"
            name="assignedToId"
            defaultValue={ticket.assignedToId || ""}
            onChange={() => setConfirmUnassign(false)}
          >
            <option value="">Unassigned</option>
            {people
              .filter((u) => u.role !== "EMPLOYEE")
              .map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name}
                </option>
              ))}
          </select>
          {confirmUnassign && (
            <p className="form-hint">
              This returns the ticket to Open. Select Save assignment again to
              confirm.
            </p>
          )}
          <button className="button secondary" disabled={mutation.pending}>
            {mutation.pending ? "Saving…" : "Save assignment"}
          </button>
        </form>
      )}
      {workAction && (
        <form
          className="form-stack compact-form"
          onChange={() => setDirty(true)}
          onSubmit={async (e) => {
            e.preventDefault();
            const reason = new FormData(e.currentTarget).get("reason");
            await send(workAction, workAction === "RESOLVE" ? { reason } : {});
          }}
        >
          {workAction === "RESOLVE" && (
            <div>
              <label htmlFor="workflow-reason">Resolution summary</label>
              <textarea
                name="reason"
                id="workflow-reason"
                required
                minLength={5}
                maxLength={2000}
                rows={3}
                autoComplete="off"
              />
              <small className="muted">Visible to the requester.</small>
            </div>
          )}
          <button className="button primary" disabled={mutation.pending}>
            {mutation.pending
              ? "Saving…"
              : {
                  START: "Start work",
                  RESOLVE: "Resolve ticket",
                  CLOSE: "Close ticket",
                }[workAction]}
          </button>
        </form>
      )}
      {reopen && (
        <form
          className="form-stack compact-form"
          onChange={() => setDirty(true)}
          onSubmit={async (e) => {
            e.preventDefault();
            await send("REOPEN", {
              reason: new FormData(e.currentTarget).get("reason"),
            });
          }}
        >
          <label htmlFor="reopen-reason">Reason for reopening</label>
          <textarea
            id="reopen-reason"
            name="reason"
            required
            minLength={5}
            maxLength={2000}
            rows={3}
            autoComplete="off"
          />
          <button className="button secondary" disabled={mutation.pending}>
            {mutation.pending ? "Saving…" : "Reopen ticket"}
          </button>
        </form>
      )}
      {staff && (
        <form
          className="form-stack compact-form"
          onSubmit={async (e) => {
            e.preventDefault();
            await send("PRIORITY", {
              priority: new FormData(e.currentTarget).get("priority"),
            });
          }}
        >
          <label htmlFor="edit-priority">Priority</label>
          <select
            key={ticket.priority}
            id="edit-priority"
            name="priority"
            defaultValue={ticket.priority}
          >
            {priorities.map((p) => (
              <option key={p} value={p}>
                {label(p)}
              </option>
            ))}
          </select>
          <button className="button secondary" disabled={mutation.pending}>
            {mutation.pending ? "Saving…" : "Save priority"}
          </button>
        </form>
      )}
    </section>
  );
}
