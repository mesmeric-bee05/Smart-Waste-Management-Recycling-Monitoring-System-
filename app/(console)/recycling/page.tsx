import { Recycle, Weight } from "lucide-react";
import { getDashboardData } from "@/server/services/queries";
import { PageHeading } from "@/components/page-heading";
import { OverviewCharts } from "@/components/overview-charts";

export default async function RecyclingPage() {
  const data = await getDashboardData();
  return (
    <>
      <PageHeading
        eyebrow="Material recovery"
        title="Recycling & diversion"
        description="Summarize recorded material weights from completed collections; values depend on accurate field entry and categorization."
        actions={<span className="badge badge-neutral">Last 30 days</span>}
      />
      <div className="simulation-banner">
        <span className="badge badge-simulated">ESTIMATE</span>
        <span>
          Recorded totals include fictional seed data in demo mode. Diversion uses plastic, paper, glass and
          metal as the recyclable set. No sorting facility, downstream recovery, or greenhouse-gas outcome is
          measured by this MVP.
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
          <div className="kpi-value">{data.kpis.totalKg.toLocaleString()} kg</div>
          <div className="kpi-foot">Completed records · 30-day window</div>
        </section>
        <section className="panel kpi-card">
          <div className="kpi-top">
            <span>Recorded recyclable material</span>
            <span className="kpi-icon">
              <Recycle size={16} />
            </span>
          </div>
          <div className="kpi-value">{data.kpis.recycledKg.toLocaleString()} kg</div>
          <div className="kpi-foot">Plastic, paper, glass and metal</div>
        </section>
        <section className="panel kpi-card">
          <div className="kpi-top">
            <span>Recorded diversion rate</span>
            <span className="badge badge-neutral">Ratio</span>
          </div>
          <div className="kpi-value">
            {data.kpis.diversionRate === null ? "—" : `${data.kpis.diversionRate}%`}
          </div>
          <div className="kpi-foot">Recyclable kg ÷ all recorded kg</div>
        </section>
        <section className="panel kpi-card">
          <div className="kpi-top">
            <span>Estimated CO₂e avoided</span>
            <span className="badge badge-amber">Provisional</span>
          </div>
          <div className="kpi-value">{(data.kpis.recycledKg * 2.5).toLocaleString()} kg</div>
          <div className="kpi-foot">Recyclable kg × 2.5 factor · not measured</div>
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
              <li>Diversion rate = eligible recyclable weight ÷ total recorded material weight.</li>
              <li>
                CO₂e estimate = recyclable weight × 2.5 kg CO₂e/kg per blueprint assumption; validate the
                factor for local methodology before use.
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
