import Link from "next/link";
import { Download, FileSpreadsheet, FileText } from "lucide-react";
import { PageHeading } from "@/components/page-heading";
import { getDashboardData, getReportOptions, type DashboardFilters } from "@/server/services/queries";

function day(value: string | undefined) {
  if (value && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const parsed = new Date(`${value}T00:00:00.000Z`);
    if (!Number.isNaN(parsed.valueOf()) && parsed.toISOString().slice(0, 10) === value) return value;
  }
  return undefined;
}

export default async function ReportsPage({ searchParams }: { searchParams: Promise<DashboardFilters> }) {
  const params = await searchParams;
  const options = await getReportOptions();
  const from = day(params.from) ?? options.defaultFrom;
  const to = day(params.to) ?? options.today;
  const zone = options.zones.includes(params.zone ?? "") ? params.zone! : "";
  const category = options.categories.includes(params.category as (typeof options.categories)[number])
    ? params.category!
    : "";
  const filters = { from, to, zone, category };
  const data = await getDashboardData(filters);
  const query = new URLSearchParams({ ...filters, format: "csv" }).toString();
  const pdfQuery = new URLSearchParams({ ...filters, format: "pdf" }).toString();
  return (
    <>
      <PageHeading
        eyebrow="Exportable insight"
        title="Reports & exports"
        description="Download organization-scoped completed collection records with date, zone and material filters. Exports are generated server-side, audited and not shared externally."
      />
      <div className="simulation-banner">
        <span className="badge badge-simulated">PROVENANCE</span>
        <span>
          CSV formula-injection protection is enabled. Seeded records remain marked SIMULATED. CO₂e uses the
          documented provisional 2.5 kg/kg factor and is an estimate, not measured impact.
        </span>
      </div>
      <div className="dashboard-grid" style={{ marginTop: 14 }}>
        <section className="panel">
          <div className="panel-head">
            <div>
              <h2 className="panel-title">Select report scope</h2>
              <p className="panel-subtitle">Inclusive UTC calendar days; maximum one-year window.</p>
            </div>
          </div>
          <div className="panel-body">
            <form method="get" className="form-grid">
              <div className="field">
                <label htmlFor="report-from">From (UTC)</label>
                <input id="report-from" type="date" name="from" defaultValue={from} required />
              </div>
              <div className="field">
                <label htmlFor="report-to">To (UTC)</label>
                <input id="report-to" type="date" name="to" defaultValue={to} required />
              </div>
              <div className="field">
                <label htmlFor="report-zone">Zone</label>
                <select id="report-zone" name="zone" defaultValue={zone}>
                  <option value="">All zones</option>
                  {options.zones.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label htmlFor="report-category">Waste category</label>
                <select id="report-category" name="category" defaultValue={category}>
                  <option value="">All categories</option>
                  {options.categories.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-actions field-wide">
                <button className="button button-primary" type="submit">
                  Apply report filters
                </button>
              </div>
            </form>
            <div className="toolbar" style={{ marginTop: 16 }}>
              <Link className="button" href={`/api/reports/export?${query}`}>
                <FileSpreadsheet size={15} />
                Download CSV
              </Link>
              <Link className="button" href={`/api/reports/export?${pdfQuery}`}>
                <FileText size={15} />
                Download PDF
              </Link>
            </div>
          </div>
        </section>
        <section className="panel">
          <div className="panel-head">
            <div>
              <h2 className="panel-title">Selected-window summary</h2>
              <p className="panel-subtitle">Calculated from completed records matching the current filters</p>
            </div>
          </div>
          <div className="panel-body">
            <div className="activity-list">
              <div className="activity-row">
                <span className="activity-mark" />
                <div>
                  <div className="activity-text">
                    <strong>{data.kpis.completed}</strong> completed collections
                  </div>
                  <div className="activity-time">Selected UTC dates and filters</div>
                </div>
              </div>
              <div className="activity-row">
                <span className="activity-mark" />
                <div>
                  <div className="activity-text">
                    <strong>{data.kpis.totalKg.toLocaleString()} kg</strong> recorded total material
                  </div>
                  <div className="activity-time">Category: {category || "all categories"}</div>
                </div>
              </div>
              <div className="activity-row">
                <span className="activity-mark" />
                <div>
                  <div className="activity-text">
                    <strong>{data.kpis.recycledKg.toLocaleString()} kg</strong> recorded recyclable material
                  </div>
                  <div className="activity-time">Zone: {zone || "all zones"}</div>
                </div>
              </div>
            </div>
            <p className="field-help" style={{ marginTop: 12 }}>
              CSV includes details, metadata, per-zone, per-category and total summary rows. PDF includes the
              same overall and category summaries and indicates if detail rows exceed its display cap. Both
              include the generation timestamp and actor.
            </p>
          </div>
        </section>
      </div>
      <section className="panel" style={{ marginTop: 14 }}>
        <div className="panel-head">
          <div>
            <h2 className="panel-title">Data and report scope</h2>
            <p className="panel-subtitle">No unauthorized personal data in exports</p>
          </div>
          <Download size={16} color="var(--brand)" />
        </div>
        <div className="panel-body">
          <p style={{ fontSize: 12, color: "var(--ink-muted)" }}>
            Exports contain completed date, point code and zone, material category and kilogram weight,
            simulated provenance, report window, generation timestamp, actor and provisional CO₂e estimate.
            Requester contact details, user password data and raw telemetry payloads are not included. Invalid
            ranges or authorization errors produce no export.
          </p>
        </div>
      </section>
    </>
  );
}
