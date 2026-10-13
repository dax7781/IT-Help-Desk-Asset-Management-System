"use client";
import { useRef, useState } from "react";
import { roles, label, type Role } from "@/lib/constants";
import {
  useMutation,
  MutationFeedback,
  useUnsavedChanges,
} from "@/components/mutation-feedback";
export function UserCreateForm() {
  const mutation = useMutation(),
    ref = useRef<HTMLFormElement>(null),
    setDirty = useUnsavedChanges();
  return (
    <form
      ref={ref}
      className="panel form-stack"
      onChange={() => setDirty(true)}
      onSubmit={async (e) => {
        e.preventDefault();
        const values = new FormData(e.currentTarget);
        if (
          await mutation.send(
            "/api/admin/users",
            Object.fromEntries(
              ["name", "email", "role", "password"].map((key) => [
                key,
                values.get(key),
              ]),
            ),
          )
        ) {
          setDirty(false);
          ref.current?.reset();
        }
      }}
    >
      <h2>Provision a user</h2>
      <p className="muted small">
        Create an account with a unique email and an initial password of at
        least 12 characters.
      </p>
      <div className="form-grid">
        {[
          {
            name: "name",
            text: "Full name",
            type: "text",
            min: 2,
            max: 100,
            autocomplete: "name",
          },
          {
            name: "email",
            text: "Email",
            type: "email",
            max: 254,
            autocomplete: "email",
          },
          {
            name: "password",
            text: "Initial password",
            type: "password",
            min: 12,
            max: 72,
            autocomplete: "new-password",
          },
        ].map((f) => (
          <div key={f.name}>
            <label htmlFor={`user-${f.name}`}>{f.text}</label>
            <input
              id={`user-${f.name}`}
              name={f.name}
              type={f.type}
              minLength={f.min}
              maxLength={f.max}
              required
              autoComplete={f.autocomplete}
              spellCheck={f.type !== "email"}
              aria-invalid={!!mutation.fields[f.name]}
              aria-describedby={
                mutation.fields[f.name] ? `user-${f.name}-error` : undefined
              }
            />
            {mutation.fields[f.name] && (
              <small id={`user-${f.name}-error`} className="field-error">
                {mutation.fields[f.name].join(" ")}
              </small>
            )}
          </div>
        ))}
        <div>
          <label htmlFor="new-role">Role</label>
          <select id="new-role" name="role" defaultValue="EMPLOYEE">
            {roles.map((r) => (
              <option key={r} value={r}>
                {label(r)}
              </option>
            ))}
          </select>
        </div>
      </div>
      <MutationFeedback {...mutation} />
      <button className="button primary" disabled={mutation.pending}>
        {mutation.pending ? "Creating…" : "Create user"}
      </button>
    </form>
  );
}
export function UserEditor({
  user,
}: {
  user: {
    id: string;
    name: string;
    email: string;
    role: Role;
    isActive: boolean;
    version: number;
  };
}) {
  const mutation = useMutation(),
    [confirmed, setConfirmed] = useState(false);
  return (
    <form
      className="user-row"
      onSubmit={async (e) => {
        e.preventDefault();
        const values = new FormData(e.currentTarget);
        const isActive = values.get("active") === "true",
          role = values.get("role");
        if (
          (!isActive || role !== user.role) &&
          values.get("confirm") !== "on"
        ) {
          e.currentTarget
            .querySelector<HTMLInputElement>('input[name="confirm"]')
            ?.setCustomValidity("Confirm this access change before saving.");
          e.currentTarget.reportValidity();
          return;
        }
        const saved = await mutation.send(
          `/api/admin/users/${user.id}`,
          { version: user.version, role, isActive },
          "PATCH",
        );
        if (saved) setConfirmed(false);
      }}
    >
      <div className="user-identity">
        <strong>{user.name}</strong>
        <span>{user.email}</span>
      </div>
      <div>
        <label className="sr-only" htmlFor={`role-${user.id}`}>
          Role for {user.name}
        </label>
        <select
          key={user.role}
          id={`role-${user.id}`}
          name="role"
          defaultValue={user.role}
        >
          {roles.map((r) => (
            <option key={r} value={r}>
              {label(r)}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="sr-only" htmlFor={`active-${user.id}`}>
          Account status for {user.name}
        </label>
        <select
          key={String(user.isActive)}
          id={`active-${user.id}`}
          name="active"
          defaultValue={String(user.isActive)}
        >
          <option value="true">Active</option>
          <option value="false">Inactive</option>
        </select>
      </div>
      <button className="button secondary" disabled={mutation.pending}>
        {mutation.pending ? "Saving…" : "Save user"}
      </button>
      <label className="checkbox-label user-confirm">
        <input
          name="confirm"
          type="checkbox"
          checked={confirmed}
          onChange={(e) => {
            e.currentTarget.setCustomValidity("");
            setConfirmed(e.currentTarget.checked);
          }}
        />{" "}
        Confirm role or access changes for {user.name}
      </label>
      <div className="user-feedback">
        <MutationFeedback {...mutation} />
      </div>
    </form>
  );
}
