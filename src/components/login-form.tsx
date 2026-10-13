"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { MutationFeedback } from "@/components/mutation-feedback";
export default function LoginForm() {
  const router = useRouter();
  const [pending, setPending] = useState(false),
    [error, setError] = useState("");
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError("");
    const form = new FormData(event.currentTarget);
    try {
      const result = await signIn("credentials", {
        email: form.get("email"),
        password: form.get("password"),
        redirect: false,
      });
      if (result?.error || !result?.ok) {
        setError("Unable to sign in. Check your details or try again later.");
        setPending(false);
      } else {
        router.push("/dashboard");
        router.refresh();
      }
    } catch {
      setError("Unable to sign in. Please try again.");
      setPending(false);
    }
  }
  return (
    <form onSubmit={submit} className="form-stack">
      <div>
        <label htmlFor="email">Email address</label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="username"
          spellCheck={false}
          placeholder="you@company.com"
          required
          maxLength={254}
        />
      </div>
      <div>
        <label htmlFor="password">Password</label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          maxLength={72}
        />
      </div>
      <MutationFeedback error={error} success="" />
      <button className="button primary full" disabled={pending}>
        {pending ? "Signing in…" : "Sign in to TechDesk"}
      </button>
    </form>
  );
}
