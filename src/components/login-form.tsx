"use client";

import { useState, type FormEvent } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, LockKeyhole } from "lucide-react";

export function LoginForm() {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [passwordVisible, setPasswordVisible] = useState(false);

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
      if (result?.error) {
        setError("Sign-in could not be completed. Check your details or contact an administrator.");
      } else {
        router.replace("/dashboard");
      }
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
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="username"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          maxLength={254}
          required
        />
      </div>
      <div className="field">
        <label htmlFor="password">Password</label>
        <div className="password-control">
          <input
            id="password"
            name="password"
            type={passwordVisible ? "text" : "password"}
            autoComplete="current-password"
            minLength={12}
            maxLength={128}
            required
          />
          <button
            aria-label={passwordVisible ? "Hide password" : "Show password"}
            aria-pressed={passwordVisible}
            className="password-visibility"
            onClick={() => setPasswordVisible((visible) => !visible)}
            type="button"
          >
            {passwordVisible ? <EyeOff size={17} aria-hidden="true" /> : <Eye size={17} aria-hidden="true" />}
          </button>
        </div>
      </div>
      {error && (
        <p className="feedback feedback-error" role="alert">
          {error}
        </p>
      )}
      <button
        type="submit"
        disabled={pending}
        aria-busy={pending}
        className="button button-primary login-submit"
      >
        <LockKeyhole size={15} aria-hidden="true" />
        {pending ? "Verifying…" : "Sign in securely"}
      </button>
      <p className="field-help">
        Access is invitation-only. Ask your organization administrator for an account.
      </p>
    </form>
  );
}
