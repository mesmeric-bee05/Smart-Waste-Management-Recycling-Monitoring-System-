import { CalendarClock } from "lucide-react";
import { requirePageActor } from "@/server/authorization";
import { getActiveCollectors, getCollectionPoints, getCollections } from "@/server/services/queries";
import { CollectionControls, ScheduleForm } from "@/components/forms";
import { PageHeading } from "@/components/page-heading";
import { RoutePreview } from "@/components/route-preview";

const statusTone: Record<string, string> = {
  SCHEDULED: "badge-neutral",
  IN_PROGRESS: "badge-amber",
  COMPLETED: "badge-green",
  MISSED: "badge-red",
  CANCELLED: "badge-neutral",
};

export default async function CollectionsPage() {
  const actor = await requirePageActor();
  const [collections, points, collectors] = await Promise.all([
    getCollections(),
    getCollectionPoints(),
    actor.role === "COLLECTOR" ? Promise.resolve([]) : getActiveCollectors(),
  ]);
  const routeStops = [
    ...new Map(
      collections
        .filter((collection) => collection.status === "SCHEDULED")
        .map((collection) => [
          collection.point.id,
          {
            id: collection.point.id,
            code: collection.point.code,
            name: collection.point.name,
            latitude: collection.point.latitude,
            longitude: collection.point.longitude,
          },
        ]),
    ).values(),
  ];
  return (
    <>
      <PageHeading
        eyebrow="Route & crew operations"
        title="Collection work"
        description="Schedule and assign collections, then record the work actually completed. This is an administrative queue—not live dispatch."
        actions={
          <span className="badge badge-simulated">
            <CalendarClock size={12} />
            No automatic dispatch
          </span>
        }
      />
      {actor.role !== "COLLECTOR" && (
        <ScheduleForm
          points={points.map(({ id, code, name, zone }) => ({ id, code, name, zone }))}
          collectors={collectors}
        />
      )}
      {actor.role !== "COLLECTOR" && (
        <div style={{ marginTop: 14 }}>
          <RoutePreview points={routeStops} />
        </div>
      )}
      <section className="panel" style={{ marginTop: 14 }}>
        <div className="panel-head">
          <div>
            <h2 className="panel-title">Collection ledger</h2>
            <p className="panel-subtitle">
              Showing the most recent 200 records; collectors see only their assigned work.
            </p>
          </div>
          <span className="badge badge-neutral">{collections.length} records</span>
        </div>
        <div className="data-table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Status</th>
                <th>Schedule / completed</th>
                <th>Collection point</th>
                <th>Assigned to</th>
                <th>Recorded weight</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {collections.map((collection) => {
                const weight = collection.materials.reduce((sum, item) => sum + item.weightKg, 0);
                return (
                  <tr key={collection.id}>
                    <td>
                      <span className={`badge ${statusTone[collection.status] ?? "badge-neutral"}`}>
                        {collection.status.replaceAll("_", " ")}
                      </span>
                      {collection.isSimulated && (
                        <div style={{ marginTop: 4 }}>
                          <span className="badge badge-simulated">SIMULATED</span>
                        </div>
                      )}
                    </td>
                    <td>
                      {collection.scheduledAt.toLocaleDateString()}
                      <br />
                      <span className="field-help">
                        {collection.completedAt
                          ? `Completed ${collection.completedAt.toLocaleString()}`
                          : `Created ${collection.createdAt.toLocaleDateString()}`}
                      </span>
                    </td>
                    <td>
                      <strong>{collection.point.code}</strong>
                      <br />
                      <span className="muted">
                        {collection.point.name} · {collection.point.zone}
                      </span>
                    </td>
                    <td>
                      {collection.assignedCollector?.fullName ?? <span className="muted">Unassigned</span>}
                    </td>
                    <td className="mono">{weight ? `${weight.toFixed(1)} kg` : "—"}</td>
                    <td>
                      <CollectionControls id={collection.id} status={collection.status} role={actor.role} />
                    </td>
                  </tr>
                );
              })}
              {collections.length === 0 && (
                <tr>
                  <td colSpan={6} className="empty-state">
                    No collection records. Schedule work or seed fictional demo data.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
      <div className="simulation-banner" style={{ marginTop: 14 }}>
        <span className="badge badge-simulated">PROVENANCE</span>
        <span>
          For each completion, material weights are entered in kilograms. The CO₂e value shown in reports uses
          the blueprint’s provisional factor of 2.5 kg per kg of recyclable material and is an estimate only.
        </span>
      </div>
    </>
  );
}
