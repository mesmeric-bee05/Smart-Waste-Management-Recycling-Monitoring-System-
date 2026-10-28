"use client";

import { useState, type FormEvent } from "react";

export function PublicRequestForm() {
  const [message, setMessage] = useState("");
  const [reference, setReference] = useState("");
  const [error, setError] = useState(false);
  const [pending, setPending] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const payload = {
      requesterName: String(form.get("name") ?? ""),
      contactEmail: String(form.get("email") ?? ""),
      message: String(form.get("message") ?? ""),
    };
    setPending(true);
    setMessage("");
    setReference("");
    try {
      const response = await fetch("/api/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        credentials: "same-origin",
      });
      const result = (await response.json()) as { message?: string; reference?: string; error?: string };
      if (!response.ok) throw new Error(result.error ?? "Unable to send request.");
      setError(false);
      setReference(result.reference ?? "");
      setMessage("Request received. Keep the reference shown below for follow-up.");
      formElement.reset();
    } catch (cause) {
      setError(true);
      setMessage(cause instanceof Error ? cause.message : "Request intake is temporarily unavailable.");
    } finally {
      setPending(false);
    }
  }
  return (
    <form className="login-form" method="post" onSubmit={submit}>
      <div className="field">
        <label htmlFor="name">
          Name <span className="muted">(optional)</span>
        </label>
        <input id="name" name="name" autoComplete="name" maxLength={80} />
      </div>
      <div className="field">
        <label htmlFor="email">
          Contact email <span className="muted">(optional)</span>
        </label>
        <input id="email" name="email" type="email" autoComplete="email" maxLength={254} />
      </div>
      <div className="field">
        <label htmlFor="message">What needs attention?</label>
        <textarea
          id="message"
          name="message"
          minLength={12}
          maxLength={1000}
          required
          placeholder="Describe the collection issue. Avoid sharing sensitive personal information."
        />
      </div>
      <p className="field-help">
        Do not include emergency, payment, or other sensitive information. This demo intake does not send
        email or emergency alerts.
      </p>
      <button className="button button-primary" disabled={pending} type="submit">
        {pending ? "Sending…" : "Send request"}
      </button>
      {message && (
        <p className={`feedback${error ? " feedback-error" : ""}`} role={error ? "alert" : "status"}>
          {message}
          {reference && (
            <>
              <br />
              <strong className="mono">Reference: {reference}</strong>
            </>
          )}
        </p>
      )}
    </form>
  );
}
