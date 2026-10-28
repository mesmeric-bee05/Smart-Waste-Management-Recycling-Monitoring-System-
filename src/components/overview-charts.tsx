"use client";

import {
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const colors = ["#0f766e", "#2d9a81", "#70b7a1", "#d49a32", "#9bb1aa", "#66847b", "#bb6a62", "#7189a0"];
type Daily = { date: string; kg: number };
type Category = { name: string; value: number };

export function OverviewCharts({ trend, categories }: { trend: Daily[]; categories: Category[] }) {
  return (
    <>
      <section className="panel">
        <div className="panel-head">
          <div>
            <h2 className="panel-title">Collected material · 30 days</h2>
            <p className="panel-subtitle">Kilograms from completed collection records</p>
          </div>
          <span className="mono muted" style={{ fontSize: 10 }}>
            kg
          </span>
        </div>
        <div className="panel-body">
          <div className="chart-wrap">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trend} margin={{ top: 8, right: 10, left: -14, bottom: 0 }}>
                <CartesianGrid stroke="#eaf0ed" strokeDasharray="3 3" vertical={false} />
                <XAxis
                  dataKey="date"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: "#7a8983", fontSize: 10 }}
                  minTickGap={22}
                />
                <YAxis tickLine={false} axisLine={false} tick={{ fill: "#7a8983", fontSize: 10 }} />
                <Tooltip
                  contentStyle={{ borderRadius: 10, border: "1px solid #dbe5e0", fontSize: 11 }}
                  formatter={(value) => [`${value ?? 0} kg`, "Recorded"]}
                />
                <Line
                  type="monotone"
                  dataKey="kg"
                  stroke="#0f766e"
                  strokeWidth={2.5}
                  dot={false}
                  activeDot={{ r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          {trend.length === 0 && (
            <p className="empty-state">No completed material records in the selected period.</p>
          )}
        </div>
      </section>
      <section className="panel">
        <div className="panel-head">
          <div>
            <h2 className="panel-title">Material mix</h2>
            <p className="panel-subtitle">Recorded weights by category</p>
          </div>
        </div>
        <div className="panel-body">
          <div className="chart-wrap short">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categories}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={55}
                  outerRadius={82}
                  paddingAngle={2}
                  stroke="none"
                >
                  {categories.map((entry, index) => (
                    <Cell key={entry.name} fill={colors[index % colors.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value) => [`${value ?? 0} kg`, "Weight"]}
                  contentStyle={{ borderRadius: 10, border: "1px solid #dbe5e0", fontSize: 11 }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {categories.slice(0, 8).map((item, index) => (
              <span key={item.name} className="badge badge-neutral">
                <i
                  className="legend-dot"
                  style={{ width: 7, height: 7, background: colors[index % colors.length] }}
                />
                {item.name}
              </span>
            ))}
          </div>
          {categories.length === 0 && <p className="empty-state">No material weights recorded yet.</p>}
        </div>
      </section>
    </>
  );
}
