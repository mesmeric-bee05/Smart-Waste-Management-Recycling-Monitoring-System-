import Link from "next/link";
import { PublicRequestForm } from "@/components/public-request-form";
import { Recycle } from "lucide-react";

export const metadata = { title: "Submit a collection request" };

export default function PublicReportPage() {
  return (
    <main className="login-screen">
      <section className="login-art">
        <Link className="brand" href="/" style={{ padding: 0, border: 0, color: "inherit" }}>
          <span className="brand-mark">
            <Recycle size={22} />
          </span>
          <strong className="brand-name">WasteOps</strong>
        </Link>
        <div>
          <p className="eyebrow" style={{ color: "#91dbc7" }}>
            Community intake
          </p>
          <h1>Tell us what needs collection.</h1>
          <p>
            Send a request to the operations team. A request is not a guarantee of pickup or emergency
            response.
          </p>
        </div>
        <small style={{ color: "#a8c4bb" }}>Share only the details needed to describe the issue.</small>
      </section>
      <section className="login-panel">
        <div className="login-box">
          <p className="eyebrow">Public request</p>
          <h2>Collection request</h2>
          <p>Requests are stored for authorized staff review.</p>
          <PublicRequestForm />
          <p style={{ marginTop: 18, fontSize: 11, color: "var(--ink-muted)" }}>
            <Link href="/login">Back to team sign in</Link>
          </p>
        </div>
      </section>
    </main>
  );
}
