import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, ArrowUpRight, LockKeyhole, Recycle, ShieldCheck } from "lucide-react";
import { auth } from "@/auth";
import { LoginForm } from "@/components/login-form";

export const metadata: Metadata = { title: "Staff sign in" };

export default async function LoginPage() {
  const session = await auth();
  if (session?.user?.id) redirect("/dashboard");

  return (
    <div className="signin-page">
      <header className="signin-header">
        <Link className="signin-brand" href="/" aria-label="WasteOps home">
          <span className="signin-brand__mark" aria-hidden="true">
            <Recycle size={18} />
          </span>
          <span>WasteOps</span>
        </Link>
        <Link className="signin-header__back" href="/">
          <ArrowLeft size={14} aria-hidden="true" /> Back to overview
        </Link>
      </header>

      <main className="signin-main">
        <section className="signin-card" aria-labelledby="signin-title">
          <div className="signin-card__icon" aria-hidden="true">
            <LockKeyhole size={20} />
          </div>
          <p className="signin-card__eyebrow">SECURE STAFF WORKSPACE</p>
          <h1 id="signin-title">Sign in to WasteOps</h1>
          <p className="signin-card__intro">
            Continue with the organization-issued account provided by your administrator.
          </p>

          <LoginForm />

          <div className="signin-access-note">
            <ShieldCheck size={17} aria-hidden="true" />
            <p>
              <strong>Invitation-only access.</strong> Staff accounts are created by your organization
              administrator; there is no public self-sign-up.
            </p>
          </div>

          <div className="signin-public-link">
            <span>Looking to report a collection issue?</span>
            <Link href="/report">
              Submit a public request <ArrowUpRight size={14} aria-hidden="true" />
            </Link>
          </div>
        </section>
        <p className="signin-boundary-note">
          Software-only MVP · No live sensors, vehicle GPS, fleet dispatch, or industrial controls are
          connected.
        </p>
      </main>

      <footer className="signin-footer">
        <span>WasteOps</span>
        <span>Collection activity, clearly recorded.</span>
      </footer>
    </div>
  );
}
