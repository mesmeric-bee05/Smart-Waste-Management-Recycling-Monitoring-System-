import Link from "next/link";
import { Activity, ClipboardCheck, MapPin, Recycle, Truck, Weight } from "lucide-react";
import { getDashboardData, wasteCategories, type DashboardFilters } from "@/server/services/queries";
import { PageHeading } from "@/components/page-heading";
import { OverviewCharts } from "@/components/overview-charts";

function Kpi({
  label,
  value,
  hint,
  icon: Icon,
}: {
  label: string;
  value: string | number;
  hint: string;
  icon: typeof MapPin;
}) {
  return (
    <section className="panel kpi-card">
      <div className="kpi-top">
        <span>{label}</span>
        <span className="kpi-icon">
          <Icon size={16} />
        </span>
      </div>
      <div className="kpi-value">{value}</div>
      <div className="kpi-foot">{hint}</div>
    </section>
  );
}

export default async function DashboardPage({ searchParams }: { searchParams: Promise<DashboardFilters> }) {
  const params = await searchParams;
  const data = await getDashboardData(params);
  const { kpis, filters } = data;
  return (
    <>
      <PageHeading
        eyebrow="Operational overview"
        title="Collection activity, without the guesswork."
        description="A current view of recorded collection work, recycling weights and requests across your organization."
        actions={
          <Link className="button button-primary" href="/collections">
            <ClipboardCheck size={15} />
            Open collection work
          </Link>
        }
      />
      <div className="simulation-banner" role="note">
        <span className="badge badge-simulated">SIMULATED</span>
        <span>
          Seeded sample readings and vehicle locations are fictional. Live sensors, GPS and dispatch are not
          connected. All quantities below are recorded values, not independently verified environmental
          impact.
        </span>
      </div>
      <section className="panel filter-panel">
        <form method="get" className="filter-bar" aria-label="Filter dashboard metrics">
          <div className="field">
            <label htmlFor="filter-from">From (UTC)</label>
            <input id="filter-from" name="from" type="date" defaultValue={filters.from} />
          </div>
          <div className="field">
            <label htmlFor="filter-to">To (UTC)</label>
            <input id="filter-to" name="to" type="date" defaultValue={filters.to} />
          </div>
          <div className="field">
            <label htmlFor="filter-zone">Zone</label>
            <input
              id="filter-zone"
              name="zone"
              maxLength={60}
              placeholder="All zones"
              defaultValue={filters.zone}
            />
          </div>
          <div className="field">
            <label htmlFor="filter-category">Waste category</label>
            <select id="filter-category" name="category" defaultValue={filters.category}>
              <option value="">All categories</option>
              {wasteCategories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>
          <button className="button button-primary" type="submit">
            Apply filters
          </button>
          <Link className="button" href="/dashboard">
            Reset
          </Link>
        </form>
        <p className="field-help">
          The window includes UTC calendar dates and is limited to one year. Category filters affect completed
          collection weights; scheduled work and open requests are filtered by date/zone only.
        </p>
      </section>
      {data.isTruncated && (
        <div className="simulation-banner" role="alert">
          <span className="badge badge-amber">LARGE WINDOW</span>
          <span>
            More than 10,000 completed records match the filters. Aggregate charts are calculated from the
            first 10,000; narrow the window for complete results.
          </span>
        </div>
      )}
      <div className="kpi-grid" style={{ marginTop: 14 }}>
        <Kpi
          label="Active collection points"
          value={kpis.points}
          hint="Registered and active"
          icon={MapPin}
        />
        <Kpi
          label="Open collection work"
          value={kpis.scheduled}
          hint="Scheduled within selected window"
          icon={Truck}
        />
        <Kpi
          label={`Completed · ${filters.from}–${filters.to}`}
          value={kpis.completed}
          hint="Completed records matching filters"
          icon={ClipboardCheck}
        />
        <Kpi
          label="Requests awaiting review"
          value={kpis.requestsOpen}
          hint="Open or acknowledged · zone filter applies"
          icon={Activity}
        />
      </div>
      <div className="kpi-grid" style={{ marginTop: 12 }}>
        <Kpi
          label="Recorded materials"
          value={`${kpis.totalKg.toLocaleString()} kg`}
          hint="From completed collections"
          icon={Weight}
        />
        <Kpi
          label="Recorded recyclable material"
          value={`${kpis.recycledKg.toLocaleString()} kg`}
          hint={
            kpis.diversionRate === null
              ? "No denominator available"
              : `${kpis.diversionRate}% of recorded material`
          }
          icon={Recycle}
        />
        <section className="panel kpi-card" style={{ gridColumn: "span 2", minHeight: 115 }}>
          <div className="kpi-top">
            <span>Reporting boundary</span>
            <span className="badge badge-neutral">
              {filters.from} to {filters.to} UTC
            </span>
          </div>
          <p style={{ margin: "12px 0 0", maxWidth: 520, color: "var(--ink-muted)", fontSize: 11 }}>
            Material weights are manually entered or seeded for demonstration. Diversion is recorded plastic,
            paper, glass and metal divided by all recorded material (or the selected category scope). Any CO₂
            estimate is not a measured outcome.
          </p>
        </section>
      </div>
      <div className="dashboard-grid">
        <OverviewCharts trend={data.trendData} categories={data.categoryData} />
        <section className="panel">
          <div className="panel-head">
            <div>
              <h2 className="panel-title">Fill watchlist</h2>
              <p className="panel-subtitle">
                Only readings received within the past 36 hours; older samples are marked stale on the
                telemetry screen.
              </p>
            </div>
            <Link className="button" href="/telemetry">
              View telemetry
            </Link>
          </div>
          <div className="panel-body">
            <div className="activity-list">
              {data.highFill.map((reading) => (
                <div className="activity-row" key={reading.id}>
                  <span
                    className="activity-mark"
                    style={{ background: reading.fillPct >= 95 ? "#bf3949" : "#d08b1e" }}
                  />
                  <div style={{ flex: 1 }}>
                    <div className="activity-text">
                      <strong>{reading.point.code}</strong> · {reading.point.name}
                    </div>
                    <div className="activity-time">
                      {reading.point.zone} · sample at {reading.recordedAt.toLocaleString()}
                    </div>
                    <div className="fill-meter" style={{ marginTop: 7 }}>
                      <span className="mono" style={{ width: 34 }}>
                        {reading.fillPct}%
                      </span>
                      <div className="fill-track">
                        <div
                          className={`fill-level${reading.fillPct >= 95 ? " critical" : " warning"}`}
                          style={{ width: `${reading.fillPct}%` }}
                        />
                      </div>
                      <span className="badge badge-simulated">SIM</span>
                    </div>
                  </div>
                </div>
              ))}
              {data.highFill.length === 0 && (
                <div className="empty-state">No recent readings at or above 80%.</div>
              )}
            </div>
          </div>
        </section>
      </div>
      {data.actor.role === "ADMIN" && (
        <div className="dashboard-grid-secondary">
          <section className="panel">
            <div className="panel-head">
              <div>
                <h2 className="panel-title">Recent system activity</h2>
                <p className="panel-subtitle">Admin-only audit feed</p>
              </div>
              <Link className="button" href="/audit">
                Audit trail
              </Link>
            </div>
            <div className="panel-body">
              <div className="activity-list">
                {data.recentAudit.map((event) => (
                  <div key={event.id} className="activity-row">
                    <span className="activity-mark" />
                    <div>
                      <div className="activity-text">
                        <strong>{event.actor?.fullName ?? "Public intake"}</strong> · {event.action}
                      </div>
                      <div className="activity-time">
                        {event.createdAt.toLocaleString()} · {event.entityType}
                      </div>
                    </div>
                  </div>
                ))}
                {data.recentAudit.length === 0 && (
                  <div className="empty-state">No activity recorded yet.</div>
                )}
              </div>
            </div>
          </section>
          <section className="panel">
            <div className="panel-head">
              <div>
                <h2 className="panel-title">Key pathways</h2>
                <p className="panel-subtitle">Common operations</p>
              </div>
            </div>
            <div className="panel-body">
              <div className="card-grid" style={{ gridTemplateColumns: "repeat(2,minmax(0,1fr))" }}>
                {(
                  [
                    ["Collection points", "/collection-points"],
                    ["Schedule collections", "/collections"],
                    ["Recycling records", "/recycling"],
                    ["Download reports", "/reports"],
                  ] as const
                ).map(([label, href]) => (
                  <Link
                    className="panel"
                    key={href}
                    href={href}
                    style={{ padding: 13, borderRadius: 9, boxShadow: "none", fontSize: 11, fontWeight: 650 }}
                  >
                    {label}
                    <span style={{ display: "block", marginTop: 5, color: "var(--brand)", fontSize: 10 }}>
                      Open →
                    </span>
                  </Link>
                ))}
              </div>
              <p className="field-help" style={{ marginTop: 14 }}>
                Dashboard refreshed at {new Date(data.asOf).toLocaleTimeString()}.
              </p>
            </div>
          </section>
        </div>
      )}
      <footer className="page-footer">
        <span>WasteOps software MVP · Organization-scoped records</span>
        <span>CO₂e factor (when exported): 2.5 kg/kg recyclable · provisional estimate only</span>
      </footer>
    </>
  );
}
