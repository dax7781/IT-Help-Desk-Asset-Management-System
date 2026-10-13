"use client";
import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTicketInteraction } from "./ticket-interactions";
const emptyFields: Record<string, string[]> = {};
export function useMutation() {
  const router = useRouter();
  const interaction = useTicketInteraction();
  const [refreshing, startTransition] = useTransition();
  const [saving, setPending] = useState(false),
    [error, setError] = useState(""),
    [success, setSuccess] = useState("");
  const [fields, setFields] = useState<Record<string, string[]>>({});
  const pending = saving || refreshing || !!interaction?.pending;
  async function send(
    url: string,
    body: unknown,
    method = "POST",
  ): Promise<{ id?: string } | null> {
    if (pending || (interaction && !interaction.begin())) return null;
    let refresh = false;
    setPending(true);
    setError("");
    setSuccess("");
    setFields({});
    try {
      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error?.message || "Unable to save. Please try again.");
        setFields(data.error?.fieldErrors || {});
        if (response.status === 409) refresh = true;
        return null;
      }
      setSuccess("Changes saved.");
      refresh = true;
      return data;
    } catch {
      setError("Unable to save. Check your connection and try again.");
      return null;
    } finally {
      setPending(false);
      if (interaction) interaction.complete(refresh);
      else if (refresh) startTransition(() => router.refresh());
    }
  }
  return { pending, error, success, fields, send };
}
export function MutationFeedback({
  error,
  success,
  fields = emptyFields,
}: {
  error: string;
  success: string;
  fields?: Record<string, string[]>;
}) {
  const ref = useRef<HTMLParagraphElement>(null);
  useEffect(() => {
    if (error) {
      const name = Object.keys(fields)[0];
      const input = name
        ? ref.current
            ?.closest("form")
            ?.querySelector<HTMLElement>(`[name="${CSS.escape(name)}"]`)
        : null;
      if (input) input.focus();
      else ref.current?.focus();
    }
  }, [error, fields]);
  return (
    <div aria-live="polite">
      {error && (
        <p className="alert" role="alert" tabIndex={-1} ref={ref}>
          {error}
        </p>
      )}
      {success && (
        <p className="success" role="status">
          {success}
        </p>
      )}
    </div>
  );
}
export function useUnsavedChanges() {
  const [dirty, setDirty] = useState(false);
  useEffect(() => {
    if (!dirty) return;
    const listener = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", listener);
    return () => window.removeEventListener("beforeunload", listener);
  }, [dirty]);
  return setDirty;
}
