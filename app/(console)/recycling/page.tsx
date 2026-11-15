import { Recycle, Weight } from "lucide-react";
import { getDashboardData } from "@/server/services/queries";
import { PageHeading } from "@/components/page-heading";
import { OverviewCharts } from "@/components/overview-charts";

export default async function RecyclingPage() {
  const data = await getDashboardData();
  return (
    <>
      <PageHeading
        eyebrow="Recorded material categories"
        title="Collection material mix"
        description="Summarize manually recorded weights from completed collections; category eligibility does not confirm sorting or downstream recovery."
        actions={<span className="badge badge-neutral">Last 30 days</span>}
      />
      <div className="simulation-banner">
        <span className="badge badge-simulated">ESTIMATE</span>
        <span>
          Recorded totals include fictional seed data in demo mode. Plastic, paper, glass and metal are only
          potentially recyclable categories. No sorting facility, downstream recovery, landfill diversion, or
          greenhouse-gas outcome is measured by this MVP.
        </span>
      </div>
      <div className="kpi-grid" style={{ marginTop: 14 }}>
        <section className="panel kpi-card">
          <div className="kpi-top">
            <span>Total material logged</span>
            <span className="kpi-icon">
              <Weight size={16} />
            </span>
          </div>
          <div className="kpi-value">{data.kpis.totalKg.toLocaleString("en-US")} kg</div>
          <div className="kpi-foot">Completed records · 30-day window</div>
        </section>
        <section className="panel kpi-card">
          <div className="kpi-top">
            <span>Recorded eligible-category weight</span>
            <span className="kpi-icon">
              <Recycle size={16} />
            </span>
          </div>
          <div className="kpi-value">{data.kpis.eligibleCategoryKg.toLocaleString("en-US")} kg</div>
          <div className="kpi-foot">Plastic, paper, glass and metal</div>
        </section>
        <section className="panel kpi-card">
          <div className="kpi-top">
            <span>Eligible-category share</span>
            <span className="badge badge-neutral">Recorded ratio</span>
          </div>
          <div className="kpi-value">
            {data.kpis.eligibleCategorySharePct === null ? "—" : `${data.kpis.eligibleCategorySharePct}%`}
          </div>
          <div className="kpi-foot">Eligible-category kg ÷ all recorded kg</div>
        </section>
        <section className="panel kpi-card">
          <div className="kpi-top">
            <span>Illustrative CO₂e equivalent</span>
            <span className="badge badge-amber">Provisional</span>
          </div>
          <div className="kpi-value">{(data.kpis.eligibleCategoryKg * 2.5).toLocaleString("en-US")} kg</div>
          <div className="kpi-foot">Eligible-category kg × 2.5 factor · not measured or avoided</div>
        </section>
      </div>
      <div className="dashboard-grid" style={{ marginTop: 14 }}>
        <OverviewCharts trend={data.trendData} categories={data.categoryData} />
        <section className="panel">
          <div className="panel-head">
            <div>
              <h2 className="panel-title">Calculation notes</h2>
              <p className="panel-subtitle">Methodological boundaries</p>
            </div>
          </div>
          <div className="panel-body">
            <ul style={{ paddingLeft: 18, color: "var(--ink-muted)", fontSize: 12, lineHeight: 1.8 }}>
              <li>Unit: kilogram (kg), as entered on the collection record.</li>
              <li>Eligible recyclable categories: plastic, paper, glass, and metal.</li>
              <li>
                Eligible-category share = category weight ÷ total recorded material weight; this is not
                verified diversion.
              </li>
              <li>
                Illustrative CO₂e-equivalent estimate = eligible-category weight × 2.5 kg CO₂e/kg per
                blueprint assumption; it is not avoided or measured impact. Validate the factor for local
                methodology.
              </li>
              <li>Negative, zero, or missing weights are rejected or excluded by the application.</li>
              <li>Simulation-only readings and seed weights must not be reported as audited field data.</li>
            </ul>
          </div>
        </section>
      </div>
    </>
  );
}
