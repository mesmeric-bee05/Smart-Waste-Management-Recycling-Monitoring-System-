"use client";

import { useState, type FormEvent } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { LockKeyhole } from "lucide-react";

export function LoginForm() {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError("");
    const data = new FormData(event.currentTarget);
    try {
      const result = await signIn("credentials", {
        email: data.get("email"),
        password: data.get("password"),
        redirect: false,
        redirectTo: "/dashboard",
      });
      if (result?.error)
        setError("Sign-in could not be completed. Check your details or contact an administrator.");
      else router.replace("/dashboard");
    } catch {
      setError("Sign-in is temporarily unavailable. Please try again.");
    } finally {
      setPending(false);
    }
  }
  return (
    <form className="login-form" method="post" onSubmit={submit}>
      <div className="field">
        <label htmlFor="email">Work email</label>
        <input id="email" name="email" type="email" autoComplete="username" maxLength={254} required />
      </div>
      <div className="field">
        <label htmlFor="password">Password</label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          minLength={12}
          maxLength={128}
          required
        />
      </div>
      {error && (
        <p className="feedback feedback-error" role="alert">
          {error}
        </p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="button button-primary"
        style={{ width: "100%", minHeight: 44, marginTop: 3 }}
      >
        <LockKeyhole size={15} />
        {pending ? "Verifying…" : "Sign in securely"}
      </button>
      <p className="field-help">
        Access is invitation-only. Ask your organization administrator for an account.
      </p>
    </form>
  );
}
