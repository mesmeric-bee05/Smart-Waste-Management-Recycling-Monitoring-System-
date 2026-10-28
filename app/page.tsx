import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  BarChart3,
  ClipboardList,
  MapPin,
  Recycle,
  ShieldCheck,
} from "lucide-react";
import { OperationsPreviewCard } from "@/components/operations-preview-card";

const capabilities = [
  {
    number: "01",
    icon: MapPin,
    title: "Plan with a trusted register",
    description:
      "Organize collection points, zones, assignments, and schedules in one workspace built for local-authority teams.",
  },
  {
    number: "02",
    icon: ClipboardList,
    title: "Record what happened",
    description:
      "Capture completion, material categories, kilograms, timestamps, and accountable changes—not guesses.",
  },
  {
    number: "03",
    icon: BarChart3,
    title: "Review material recovery",
    description:
      "Use server-computed summaries and downloadable reports to understand recorded activity and its limits.",
  },
];

export const metadata: Metadata = {
  title: "Collection operations with clarity",
  description:
    "A software-first workspace for local-authority collection planning, material records, public requests, and transparent reporting.",
};

export default function HomePage() {
  return (
    <div className="landing-page">
      <header className="landing-header">
        <div className="landing-header__inner">
          <Link className="landing-brand" href="/">
            <span className="landing-brand__mark" aria-hidden="true">
              <Recycle size={19} />
            </span>
            <span className="landing-brand__wordmark">WasteOps</span>
            <span className="landing-brand__descriptor">CIRCULAR OPERATIONS</span>
          </Link>
          <nav className="landing-nav" aria-label="Page navigation">
            <Link href="#capabilities">How it works</Link>
            <Link href="#boundaries">Data boundaries</Link>
          </nav>
          <div className="landing-header__actions">
            <Link className="landing-header__public" href="/report">
              Public request
            </Link>
            <Link className="button button-primary landing-header__signin" href="/login">
              Staff sign in <ArrowRight size={15} aria-hidden="true" />
            </Link>
          </div>
        </div>
      </header>

      <main>
        <section className="landing-hero" aria-labelledby="landing-title">
          <div className="landing-hero__copy">
            <p className="landing-eyebrow">
              <span aria-hidden="true" /> SOFTWARE-FIRST OPERATIONS WORKSPACE
            </p>
            <h1 id="landing-title">
              Make every collection <span>count.</span>
            </h1>
            <p className="landing-hero__lede">
              Plan work, record material weights, and review collection activity in one clear workspace for
              local-authority teams.
            </p>
            <div className="landing-hero__actions">
              <Link className="button button-primary landing-cta" href="/login">
                Staff sign in <ArrowRight size={16} aria-hidden="true" />
              </Link>
              <Link className="landing-request-link" href="/report">
                Submit a collection request <ArrowUpRight size={15} aria-hidden="true" />
              </Link>
            </div>
            <div className="landing-proof" aria-label="Workspace principles">
              <span>
                <ShieldCheck size={16} aria-hidden="true" /> Role-based access
              </span>
              <span>
                <ClipboardList size={16} aria-hidden="true" /> Auditable work
              </span>
              <span>
                <Recycle size={16} aria-hidden="true" /> Clear data provenance
              </span>
            </div>
            <p className="landing-access-note">
              Staff accounts are issued by your organization administrator. Public self-registration is not
              available.
            </p>
          </div>
          <div className="landing-hero__visual">
            <div className="landing-visual-label">
              <span className="landing-visual-label__dot" aria-hidden="true" />
              An illustrative product view
            </div>
            <OperationsPreviewCard />
          </div>
        </section>

        <section className="landing-capabilities" id="capabilities" aria-labelledby="capabilities-title">
          <div className="landing-section-heading">
            <p className="landing-section-heading__eyebrow">A dependable daily workflow</p>
            <h2 id="capabilities-title">From planned work to accountable records.</h2>
            <p>Focused tools for the operational steps that belong in this software-only phase.</p>
          </div>
          <div className="landing-capabilities__grid">
            {capabilities.map(({ number, icon: Icon, title, description }) => (
              <article className="landing-capability" key={number}>
                <div className="landing-capability__top">
                  <span className="landing-capability__icon" aria-hidden="true">
                    <Icon size={19} />
                  </span>
                  <span className="landing-capability__number">{number}</span>
                </div>
                <h3>{title}</h3>
                <p>{description}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="landing-boundary" id="boundaries" aria-labelledby="boundary-title">
          <div className="landing-boundary__icon" aria-hidden="true">
            <ShieldCheck size={20} />
          </div>
          <div>
            <p className="landing-boundary__eyebrow">Clear about what is—and is not—connected</p>
            <h2 id="boundary-title">Software first. Real-world integrations later.</h2>
            <p>
              This MVP does not connect to physical sensors, live vehicle GPS, fleet dispatch, or industrial
              controls. Any sample bin readings and vehicle positions are explicitly marked{" "}
              <strong>SIMULATED</strong>.
            </p>
          </div>
          <Link href="/report" className="landing-boundary__link">
            Send a public request <ArrowUpRight size={15} aria-hidden="true" />
          </Link>
        </section>
      </main>

      <footer className="landing-footer">
        <Link className="landing-footer__brand" href="/" aria-label="WasteOps home">
          <Recycle size={16} aria-hidden="true" /> WasteOps
        </Link>
        <p>Collection records, clear provenance, accountable work.</p>
        <div>
          <Link href="/login">Staff sign in</Link>
          <Link href="/report">Public collection request</Link>
        </div>
      </footer>
    </div>
  );
}
