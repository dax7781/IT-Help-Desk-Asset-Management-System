"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useUnsavedChanges } from "@/components/mutation-feedback";
import { useEffect, useRef } from "react";
import { categories, label } from "@/lib/constants";
import type { Actor } from "@/lib/permissions";
import { ClipboardList, ShieldCheck, Laptop } from "lucide-react";
type AssetOption = {
  id: string;
  assetTag: string;
  manufacturer: string;
  model: string;
};
export default function TicketForm({
  assets,
  selectedAsset,
  requester,
}: {
  assets: AssetOption[];
  selectedAsset?: string;
  requester: Actor;
}) {
  const [assetId, setAssetId] = useState(selectedAsset || "");
  const equipment = assets.find((asset) => asset.id === assetId);
  const setDirty = useUnsavedChanges(),
    ref = useRef<HTMLFormElement>(null);
  const router = useRouter(),
    [pending, setPending] = useState(false),
    [error, setError] = useState(""),
    [fields, setFields] = useState<Record<string, string[]>>({});
  useEffect(() => {
    if (error) {
      const first = Object.keys(fields)[0];
      if (first)
        ref.current?.querySelector<HTMLElement>(`[name="${first}"]`)?.focus();
      else ref.current?.querySelector<HTMLElement>('[role="alert"]')?.focus();
    }
  }, [error, fields]);
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError("");
    setFields({});
    const form = new FormData(event.currentTarget);
    try {
      const response = await fetch("/api/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.get("title"),
          description: form.get("description"),
          category: form.get("category"),
          assetId: form.get("assetId") || null,
        }),
      });
      const result = await response.json();
      if (!response.ok) {
        setError(result.error?.message || "Unable to submit your ticket.");
        setFields(result.error?.fieldErrors || {});
        setPending(false);
        return;
      }
      setDirty(false);
      router.push("/tickets/" + result.id + "?created=1");
      router.refresh();
    } catch {
      setError("Unable to submit. Check your connection and try again.");
      setPending(false);
    }
  }
  return (
    <div className="ticket-intake-layout">
      <form
        ref={ref}
        onChange={() => setDirty(true)}
        onSubmit={submit}
        className="panel form-stack ticket-form"
      >
        <section
          className="intake-requester"
          aria-labelledby="requester-heading"
        >
          <div className="intake-section-heading">
            <span className="intake-step" aria-hidden="true">
              01
            </span>
            <div>
              <h2 id="requester-heading">Requester information</h2>
              <p>From your signed-in TechDesk account.</p>
            </div>
            <span className="intake-verified">
              <ShieldCheck size={15} aria-hidden="true" /> Signed in
            </span>
          </div>
          <dl className="requester-fields">
            <div>
              <dt>Full name</dt>
              <dd>{requester.name}</dd>
            </div>
            <div>
              <dt>Email address</dt>
              <dd>{requester.email}</dd>
            </div>
            <div>
              <dt>Account ID</dt>
              <dd>
                <code>{requester.id}</code>
              </dd>
            </div>
            <div>
              <dt>Account role</dt>
              <dd>{label(requester.role)}</dd>
            </div>
          </dl>
          <p className="small muted requester-note">
            This ticket will be recorded under your account. Contact your
            administrator if these details need correcting.
          </p>
        </section>
        <div className="intake-section-heading">
          <span className="intake-step" aria-hidden="true">
            02
          </span>
          <div>
            <h2>Issue information</h2>
            <p>
              Fields marked <span aria-label="required">*</span> are required.
            </p>
          </div>
        </div>
        <div>
          <label htmlFor="title">
            Issue title <span>*</span>
          </label>
          <input
            id="title"
            name="title"
            autoComplete="off"
            required
            minLength={5}
            maxLength={150}
            placeholder="e.g. My laptop won’t connect to Wi-Fi"
            aria-invalid={!!fields.title}
            aria-describedby={fields.title ? "title-error" : undefined}
          />
          {fields.title && (
            <small id="title-error" className="field-error">
              {fields.title.join(" ")}
            </small>
          )}
        </div>
        <div className="form-grid">
          <div>
            <label htmlFor="category">
              Category <span>*</span>
            </label>
            <select id="category" name="category" defaultValue="HARDWARE">
              {categories.map((c) => (
                <option key={c} value={c}>
                  {label(c)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="assetId">
              Affected equipment <small>optional</small>
            </label>
            <select
              id="assetId"
              name="assetId"
              value={assetId}
              onChange={(event) => setAssetId(event.target.value)}
            >
              <option value="">No equipment selected</option>
              {assets.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.assetTag} · {a.manufacturer} {a.model}
                </option>
              ))}
            </select>
            <small className="muted">
              Only equipment you’re permitted to link is shown.
            </small>
          </div>
        </div>
        <div>
          <div className="intake-section-heading description-heading">
            <span className="intake-step" aria-hidden="true">
              03
            </span>
            <div>
              <h2>Issue details</h2>
              <p>Help IT understand the problem and its impact.</p>
            </div>
          </div>
          <label htmlFor="description">
            Description <span>*</span>
          </label>
          <textarea
            id="description"
            name="description"
            rows={6}
            required
            minLength={10}
            maxLength={5000}
            placeholder="Describe the issue, when and where it started, who is affected, any error messages, and what you have already tried…"
            aria-invalid={!!fields.description}
            aria-describedby={
              fields.description
                ? "description-hint description-error"
                : "description-hint"
            }
          />
          <p id="description-hint" className="small muted description-hint">
            Include your location, impact on your work, exact error messages,
            and troubleshooting steps. Do not include passwords or access codes.
          </p>
          {fields.description && (
            <small id="description-error" className="field-error">
              {fields.description.join(" ")}
            </small>
          )}
        </div>
        <div className="form-hint">
          Your ticket starts with Medium priority. The IT team can assess its
          urgency.
        </div>
        {error && (
          <p className="alert" role="alert" tabIndex={-1}>
            {error}
          </p>
        )}
        <div className="form-actions">
          <Link href="/tickets" className="button secondary">
            Cancel
          </Link>
          <button className="button primary" disabled={pending}>
            {pending ? "Submitting…" : "Submit ticket"}
          </button>
        </div>
      </form>
      <aside className="intake-context" aria-label="Request guidance">
        <section className="panel intake-summary">
          <h2>
            <ClipboardList size={19} aria-hidden="true" /> Request details
          </h2>
          <span className="pill neutral">Not submitted</span>
          <dl className="intake-summary-fields">
            <div>
              <dt>Ticket number</dt>
              <dd>Generated after submission</dd>
            </div>
            <div>
              <dt>Initial status</dt>
              <dd>Open</dd>
            </div>
            <div>
              <dt>Initial priority</dt>
              <dd>Medium</dd>
            </div>
            <div>
              <dt>Assignment</dt>
              <dd>IT team assigns after review</dd>
            </div>
          </dl>
          <p className="small muted">
            After submission, follow progress and add public updates from the
            ticket conversation.
          </p>
        </section>
        <section className="panel intake-equipment" aria-live="polite">
          <h2>
            <Laptop size={19} aria-hidden="true" /> Linked equipment
          </h2>
          {equipment ? (
            <>
              <Link href={`/assets/${equipment.id}`} className="text-link">
                {equipment.assetTag}
              </Link>
              <p>
                {equipment.manufacturer} {equipment.model}
              </p>
              <p className="small muted">
                This equipment will be linked to your request.
              </p>
            </>
          ) : (
            <p className="small muted">
              Choose the affected equipment when the issue relates to a device.
              Leave it blank for access, software, or general support requests.
            </p>
          )}
        </section>
        <section className="intake-help">
          <h2>Before you submit</h2>
          <ul>
            <li>
              Use a specific title, such as “Laptop loses Wi-Fi in meeting
              room.”
            </li>
            <li>Choose the closest category and affected device.</li>
            <li>
              Explain what you expected, what happened, and whether you can
              still work.
            </li>
          </ul>
        </section>
      </aside>
    </div>
  );
}
