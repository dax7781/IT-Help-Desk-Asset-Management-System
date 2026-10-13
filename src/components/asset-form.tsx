"use client";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { assetTypes, assetStatuses } from "@/lib/constants";
import { label } from "@/lib/constants";
import {
  useMutation,
  MutationFeedback,
  useUnsavedChanges,
} from "@/components/mutation-feedback";
type Initial = {
  id: string;
  assetTag: string;
  type: string;
  manufacturer: string;
  model: string;
  location: string;
  status: string;
  version?: number;
  assignedUserId?: string | null;
  serialNumber?: string;
  notes?: string;
  purchaseDate?: string | null;
  warrantyUntil?: string | null;
};
export default function AssetForm({
  initial,
  people = [],
}: {
  initial?: Initial;
  people?: { id: string; name: string }[];
}) {
  const mutation = useMutation(),
    router = useRouter(),
    setDirty = useUnsavedChanges();
  const [status, setStatus] = useState(initial?.status || "AVAILABLE");
  const [assignedUser, setAssignedUser] = useState(
    initial?.assignedUserId || "",
  );
  const fields = [
    { name: "assetTag", text: "Asset tag", required: true, max: 50 },
    { name: "manufacturer", text: "Manufacturer", required: true, max: 100 },
    { name: "model", text: "Model", required: true, max: 100 },
    { name: "serialNumber", text: "Serial number (optional)", max: 100 },
    { name: "location", text: "Location", required: true, max: 150 },
    { name: "purchaseDate", text: "Purchase date (optional)", type: "date" },
    { name: "warrantyUntil", text: "Warranty end (optional)", type: "date" },
  ];
  return (
    <form
      className="panel form-stack ticket-form"
      onChange={() => setDirty(true)}
      onSubmit={async (e) => {
        e.preventDefault();
        const form = new FormData(e.currentTarget);
        const data = {
          assetTag: form.get("assetTag"),
          type: form.get("type"),
          manufacturer: form.get("manufacturer"),
          model: form.get("model"),
          serialNumber: form.get("serialNumber"),
          location: form.get("location"),
          notes: form.get("notes"),
          purchaseDate: form.get("purchaseDate") || null,
          warrantyUntil: form.get("warrantyUntil") || null,
          ...(initial
            ? {
                version: initial.version,
                status,
                assignedUserId: assignedUser || null,
              }
            : {}),
        };
        const result = await mutation.send(
          initial ? `/api/assets/${initial.id}` : "/api/assets",
          data,
          initial ? "PATCH" : "POST",
        );
        if (result) {
          setDirty(false);
          router.push(`/assets/${result.id}`);
          router.refresh();
        }
      }}
    >
      <div className="form-intro">
        <h2>{initial ? "Equipment details" : "Register equipment"}</h2>
        <p className="muted">
          Keep identifiers and location accurate. Staff notes stay within IT.
        </p>
      </div>
      <div className="form-grid">
        {fields.map((field) => (
          <div key={field.name}>
            <label htmlFor={field.name}>{field.text}</label>
            <input
              id={field.name}
              name={field.name}
              type={field.type || "text"}
              required={field.required}
              maxLength={field.max}
              defaultValue={
                (initial?.[field.name as keyof Initial] as string) || ""
              }
              autoComplete="off"
              spellCheck={!["assetTag", "serialNumber"].includes(field.name)}
              aria-invalid={!!mutation.fields[field.name]}
              aria-describedby={
                mutation.fields[field.name] ? `${field.name}-error` : undefined
              }
            />
            {mutation.fields[field.name] && (
              <small id={`${field.name}-error`} className="field-error">
                {mutation.fields[field.name].join(" ")}
              </small>
            )}
          </div>
        ))}
        <div>
          <label htmlFor="asset-type">Equipment type</label>
          <select
            id="asset-type"
            name="type"
            defaultValue={initial?.type || "LAPTOP"}
          >
            {assetTypes.map((t) => (
              <option key={t} value={t}>
                {label(t)}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div>
        <label htmlFor="asset-notes">Staff notes (optional)</label>
        <textarea
          id="asset-notes"
          name="notes"
          rows={4}
          maxLength={5000}
          defaultValue={initial?.notes || ""}
          autoComplete="off"
        />
      </div>
      {initial && (
        <div className="form-grid">
          <div>
            <label htmlFor="asset-status">Lifecycle status</label>
            <select
              id="asset-status"
              name="status"
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                if (["AVAILABLE", "RETIRED"].includes(e.target.value))
                  setAssignedUser("");
              }}
              disabled={initial.status === "RETIRED"}
            >
              {assetStatuses.map((s) => (
                <option key={s} value={s}>
                  {label(s)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="asset-user">Assigned user</label>
            <select
              id="asset-user"
              name="assignedUserId"
              value={assignedUser}
              onChange={(e) => setAssignedUser(e.target.value)}
              disabled={["AVAILABLE", "RETIRED"].includes(status)}
              required={status === "ASSIGNED"}
            >
              <option value="">Unassigned</option>
              {people.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name}
                </option>
              ))}
            </select>
            <small className="muted">
              Choose Assigned or Under repair to select a user.
            </small>
          </div>
        </div>
      )}
      {status === "RETIRED" && initial?.status !== "RETIRED" && (
        <label className="checkbox-label">
          <input type="checkbox" required name="confirmRetirement" /> Retire
          this equipment permanently and clear its assignment.
        </label>
      )}
      <MutationFeedback {...mutation} />
      <div className="form-actions">
        <Link
          className="button secondary"
          href={initial ? `/assets/${initial.id}` : "/assets"}
        >
          Cancel
        </Link>
        <button className="button primary" disabled={mutation.pending}>
          {mutation.pending
            ? "Saving…"
            : initial
              ? "Save equipment"
              : "Register equipment"}
        </button>
      </div>
    </form>
  );
}
