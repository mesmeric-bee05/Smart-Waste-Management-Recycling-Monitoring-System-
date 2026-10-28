import { MapPin, Search } from "lucide-react";
import { requirePageActor } from "@/server/authorization";
import { getCollectionPoints } from "@/server/services/queries";
import { DeactivatePointForm, EditPointForm, PointForm } from "@/components/forms";
import { PageHeading } from "@/components/page-heading";
import { PointMap } from "@/components/point-map";

export default async function CollectionPointsPage() {
  const actor = await requirePageActor();
  const points = await getCollectionPoints();
  const editable = actor.role !== "COLLECTOR";
  return (
    <>
      <PageHeading
        eyebrow="Asset register"
        title="Collection points"
        description="Maintain the registered collection locations, accepted material categories and map coordinates for your organization."
        actions={
          <span className="badge badge-neutral">
            <MapPin size={12} />
            {points.length} active points
          </span>
        }
      />
      {editable && <PointForm />}
      <section className="panel" style={{ marginTop: 14 }}>
        <div className="panel-head">
          <div>
            <h2 className="panel-title">Service area map</h2>
            <p className="panel-subtitle">
              Seeded sample locations are labeled SIMULATED DEMO COORDINATES; verify real-world locations
              before use. Stale readings are called out separately.
            </p>
          </div>
        </div>
        <div className="panel-body">
          <PointMap points={points} />
        </div>
      </section>
      <section className="panel" style={{ marginTop: 14 }}>
        <div className="panel-head">
          <div>
            <h2 className="panel-title">Registered locations</h2>
            <p className="panel-subtitle">
              Active records only. Deactivation preserves historical collections.
            </p>
          </div>
          <span className="badge badge-neutral">{points.length} active</span>
        </div>
        <div className="table-toolbar">
          <span className="field-help">Organization-scoped · coordinates use decimal degrees</span>
          <span className="mono muted" style={{ fontSize: 10 }}>
            lat / lon
          </span>
        </div>
        <div className="data-table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Code / point</th>
                <th>Zone</th>
                <th>Coordinates / provenance</th>
                <th>Capacity</th>
                <th>Accepted materials</th>
                <th>Latest fill</th>
                {editable && <th>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {points.map((point) => {
                const reading = point.readings[0];
                return (
                  <tr key={point.id}>
                    <td>
                      <strong>{point.code}</strong>
                      <br />
                      <span className="muted">{point.name}</span>
                      <br />
                      <span className="field-help">{point.address}</span>
                    </td>
                    <td>{point.zone}</td>
                    <td className="mono">
                      {point.latitude.toFixed(5)}, {point.longitude.toFixed(5)}
                      <br />
                      <span
                        className={`badge ${point.locationSource === "SIMULATED" ? "badge-simulated" : "badge-neutral"}`}
                      >
                        {point.locationSource === "SIMULATED"
                          ? "SIMULATED LOCATION"
                          : `${point.locationSource} SOURCE`}
                      </span>
                    </td>
                    <td>{point.capacityLiters} L</td>
                    <td>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                        {point.wasteCategories.slice(0, 3).map((category) => (
                          <span key={category} className="badge badge-neutral">
                            {category}
                          </span>
                        ))}
                        {point.wasteCategories.length > 3 && (
                          <span className="badge badge-neutral">+{point.wasteCategories.length - 3}</span>
                        )}
                      </div>
                    </td>
                    <td>
                      {reading ? (
                        <div className="fill-meter">
                          <span className="mono">{reading.fillPct}%</span>
                          <span
                            className={`badge ${reading.qualityStatus === "STALE" ? "badge-amber" : "badge-simulated"}`}
                          >
                            {reading.qualityStatus === "STALE" ? "STALE SAMPLE" : "SIM"}
                          </span>
                          <span className="field-help">{reading.recordedAt.toLocaleString()}</span>
                        </div>
                      ) : (
                        <span className="muted">No reading</span>
                      )}
                    </td>
                    {editable && (
                      <td>
                        <div className="toolbar">
                          <EditPointForm point={point} />
                          <DeactivatePointForm pointId={point.id} />
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })}
              {points.length === 0 && (
                <tr>
                  <td colSpan={editable ? 7 : 6} className="empty-state">
                    No active points yet. Create a point to begin.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
      <p className="field-help" style={{ marginTop: 12 }}>
        <Search size={12} style={{ verticalAlign: "-2px", marginRight: 4 }} />
        Map tiles use OpenStreetMap; terms and availability apply. Collection-point markers are rendered
        client-side. No location data is sent to a routing or dispatch service.
      </p>
    </>
  );
}
