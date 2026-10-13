"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useUnsavedChanges } from "@/components/mutation-feedback";
import { useTicketInteraction } from "./ticket-interactions";
export default function CommentForm({
  ticketId,
  staff = false,
}: {
  ticketId: string;
  staff?: boolean;
}) {
  const [internal, setInternal] = useState(false),
    setDirty = useUnsavedChanges();
  const router = useRouter(),
    [message, setMessage] = useState(""),
    [saving, setPending] = useState(false),
    [error, setError] = useState(""),
    [success, setSuccess] = useState("");
  const interaction = useTicketInteraction();
  const pending = saving || !!interaction?.pending;
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending || (interaction && !interaction.begin())) return;
    let refresh = false;
    setPending(true);
    setError("");
    setSuccess("");
    try {
      const response = await fetch("/api/tickets/" + ticketId + "/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message,
          ...(internal ? { isInternal: true } : {}),
        }),
      });
      const data = await response.json();
      if (!response.ok)
        setError(data.error?.message || "Unable to add comment.");
      else {
        setMessage("");
        setDirty(false);
        setSuccess("Comment added.");
        refresh = true;
      }
    } catch {
      setError("Unable to add comment. Please try again.");
    }
    setPending(false);
    if (interaction) interaction.complete(refresh);
    else if (refresh) router.refresh();
  }
  return (
    <form onSubmit={submit} className="comment-form">
      <label htmlFor="message">
        {internal ? "Add an internal note" : "Add a public comment"}
      </label>
      <textarea
        id="message"
        name="message"
        autoComplete="off"
        value={message}
        onChange={(e) => {
          setMessage(e.target.value);
          setDirty(true);
        }}
        rows={3}
        required
        maxLength={5000}
        placeholder="Share an update or more details…"
      />
      <p className="muted small">
        {internal
          ? "Visible only to IT staff. The requester cannot see this note."
          : "Visible to the requester and IT support team."}
      </p>
      {staff && (
        <label className="checkbox-label">
          <input
            type="checkbox"
            name="isInternal"
            checked={internal}
            onChange={(e) => setInternal(e.target.checked)}
          />{" "}
          Internal note (staff only)
        </label>
      )}
      {error && (
        <p className="alert" role="alert">
          {error}
        </p>
      )}
      {success && (
        <p className="success" role="status">
          {success}
        </p>
      )}
      <button disabled={pending || !message.trim()} className="button primary">
        {pending
          ? "Posting…"
          : internal
            ? "Post internal note"
            : "Post comment"}
      </button>
    </form>
  );
}
