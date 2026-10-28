import { Activity, Cpu, Radio, Truck } from "lucide-react";
import { requirePageActor } from "@/server/authorization";
import { getTelemetry } from "@/server/services/queries";
import { SimulationControl } from "@/components/forms";
import { PointMap } from "@/components/point-map";
import { BinVisualization } from "@/components/bin-visualization";
import { PageHeading } from "@/components/page-heading";

export default async function TelemetryPage() {
  await requirePageActor(["ADMIN", "SUPERVISOR"]);
  const data = await getTelemetry();
  const highFill = data.points.reduce((max, point) => Math.max(max, point.readings[0]?.fillPct ?? 0), 0);
  return (
    <>
      <PageHeading
        eyebrow="Demonstration only"
        title="Simulated telemetry"
        description="Generated sample readings exercise the software workflow. This screen is not connected to bins, IoT hardware, GPS or live fleet systems."
        actions={<SimulationControl />}
      />
      <div className="simulation-banner" role="note">
        <span className="badge badge-simulated">
          <Radio size={11} /> SIMULATED ONLY
        </span>
        <span>
          No MQTT broker, device certificate, RFID, hardware integration, GPS, geofence or real-time event
          stream is configured. Never use this screen for operational dispatch or safety decisions.
        </span>
      </div>
      <div className="kpi-grid" style={{ marginTop: 14 }}>
        <section className="panel kpi-card">
          <div className="kpi-top">
            <span>Registered sample points</span>
            <span className="kpi-icon">
              <Activity size={16} />
            </span>
          </div>
          <div className="kpi-value">{data.points.length}</div>
          <div className="kpi-foot">Active registered points</div>
        </section>
        <section className="panel kpi-card">
          <div className="kpi-top">
            <span>Latest sample fill</span>
            <span className="badge badge-simulated">SIM</span>
          </div>
          <div className="kpi-value">{highFill}%</div>
          <div className="kpi-foot">Most recent stored sample</div>
        </section>
        <section className="panel kpi-card">
          <div className="kpi-top">
            <span>Simulated vehicles</span>
            <span className="kpi-icon">
              <Truck size={16} />
            </span>
          </div>
          <div className="kpi-value">{data.vehicles.length}</div>
          <div className="kpi-foot">Positions are fictional</div>
        </section>
        <section className="panel kpi-card">
          <div className="kpi-top">
            <span>Connected devices</span>
            <span className="kpi-icon">
              <Cpu size={16} />
            </span>
          </div>
          <div className="kpi-value">0</div>
          <div className="kpi-foot">No device integration configured</div>
        </section>
      </div>
      <div className="dashboard-grid" style={{ marginTop: 14 }}>
        <section className="panel">
          <div className="panel-head">
            <div>
              <h2 className="panel-title">Simulated operations map</h2>
              <p className="panel-subtitle">
                Point coordinates and vehicle pings are sample data; stale locations are labeled.
              </p>
            </div>
          </div>
          <div className="panel-body">
            <PointMap points={data.points} vehicles={data.vehicles} />
          </div>
        </section>
        <BinVisualization fillPct={highFill} />
      </div>
      <section className="panel" style={{ marginTop: 14 }}>
        <div className="panel-head">
          <div>
            <h2 className="panel-title">Latest sample readings</h2>
            <p className="panel-subtitle">Stored timestamp, source, quality and provenance for each point.</p>
          </div>
          <span className="badge badge-simulated">SIMULATED</span>
        </div>
        <div className="data-table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Point</th>
                <th>Fill level</th>
                <th>Source</th>
                <th>Quality</th>
                <th>Sample time</th>
                <th>Simulated</th>
              </tr>
            </thead>
            <tbody>
              {data.points.map((point) => {
                const reading = point.readings[0];
                return (
                  <tr key={point.id}>
                    <td>
                      <strong>{point.code}</strong>
                      <br />
                      <span className="muted">{point.name}</span>
                    </td>
                    <td className="mono">{reading ? `${reading.fillPct}%` : "—"}</td>
                    <td>{reading?.source ?? "—"}</td>
                    <td>
                      {reading ? (
                        <span
                          className={`badge ${reading.qualityStatus === "STALE" ? "badge-amber" : "badge-green"}`}
                        >
                          {reading.qualityStatus}
                        </span>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td>{reading?.recordedAt.toLocaleString() ?? "—"}</td>
                    <td>
                      {reading?.isSimulated ? <span className="badge badge-simulated">SIMULATED</span> : "—"}
                    </td>
                  </tr>
                );
              })}
              {data.points.length === 0 && (
                <tr>
                  <td colSpan={6} className="empty-state">
                    No points registered.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
      <section className="panel" style={{ marginTop: 14 }}>
        <div className="panel-head">
          <div>
            <h2 className="panel-title">Vehicle sample pings</h2>
            <p className="panel-subtitle">
              Fictional coordinates; they do not indicate real crew presence or dispatch.
            </p>
          </div>
        </div>
        <div className="data-table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Vehicle</th>
                <th>Coordinate</th>
                <th>Source</th>
                <th>Quality</th>
                <th>Sample time</th>
              </tr>
            </thead>
            <tbody>
              {data.vehicles.map((vehicle) => {
                const ping = vehicle.pings[0];
                return (
                  <tr key={vehicle.id}>
                    <td>
                      <strong>{vehicle.code}</strong>
                      <br />
                      <span className="muted">{vehicle.label}</span>
                    </td>
                    <td className="mono">
                      {ping ? `${ping.latitude.toFixed(5)}, ${ping.longitude.toFixed(5)}` : "—"}
                    </td>
                    <td>{ping?.source ?? "—"}</td>
                    <td>
                      {ping ? (
                        <span
                          className={`badge ${ping.qualityStatus === "STALE" ? "badge-amber" : "badge-simulated"}`}
                        >
                          {ping.qualityStatus === "STALE" ? "STALE SAMPLE" : "SIMULATED"}
                        </span>
                      ) : (
                        "No sample"
                      )}
                    </td>
                    <td>{ping?.recordedAt.toLocaleString() ?? "—"}</td>
                  </tr>
                );
              })}
              {data.vehicles.length === 0 && (
                <tr>
                  <td colSpan={5} className="empty-state">
                    No fictional vehicles seeded.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
