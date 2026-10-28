import Link from "next/link";
import { Recycle } from "lucide-react";
import { auth } from "@/auth";
import { LoginForm } from "@/components/login-form";

export default async function LoginPage() {
  const session = await auth();
  if (session?.user?.id)
    return (
      <main className="login-panel">
        <div className="login-box">
          <h2>You’re already signed in</h2>
          <p>Your session is active.</p>
          <Link className="button button-primary" href="/dashboard">
            Continue to operations
          </Link>
        </div>
      </main>
    );
  return (
    <main className="login-screen">
      <section className="login-art" aria-label="WasteOps platform introduction">
        <Link className="brand" href="/login" style={{ padding: 0, border: 0, color: "inherit" }}>
          <span className="brand-mark">
            <Recycle size={22} />
          </span>
          <strong className="brand-name">WasteOps</strong>
        </Link>
        <div>
          <p className="eyebrow" style={{ color: "#91dbc7" }}>
            Collection & recycling operations
          </p>
          <h1>Run collection with clarity.</h1>
          <p>
            Keep schedules, material weights, requests and operational reporting in one accountable workspace.
          </p>
        </div>
        <small style={{ color: "#a8c4bb" }}>Software MVP · Simulation data is identified everywhere</small>
      </section>
      <section className="login-panel">
        <div className="login-box">
          <p className="eyebrow">Team workspace</p>
          <h2>Sign in to WasteOps</h2>
          <p>Use your organization-issued account. There is no public registration.</p>
          <LoginForm />
          <div className="login-footnote">
            No live sensors, vehicle GPS, dispatch or industrial controls are connected in this software-only
            MVP.
          </div>
          <p style={{ marginTop: 18, fontSize: 11, color: "var(--ink-muted)" }}>
            <Link href="/report">Submit a collection request without signing in</Link>
          </p>
        </div>
      </section>
    </main>
  );
}
