import { ShieldCheck } from "lucide-react";
import { getAuditEvents } from "@/server/services/queries";
import { PageHeading } from "@/components/page-heading";

export default async function AuditPage() {
  const events = await getAuditEvents();
  return (
    <>
      <PageHeading
        eyebrow="Security & accountability"
        title="Audit trail"
        description="Chronological operational events. Audit entries are append-only through the application, organization-scoped, and intentionally omit request message bodies and credentials."
        actions={
          <span className="badge badge-neutral">
            <ShieldCheck size={12} />
            Administrator only
          </span>
        }
      />
      <section className="panel">
        <div className="panel-head">
          <div>
            <h2 className="panel-title">Recorded events</h2>
            <p className="panel-subtitle">Latest 500 · newest first</p>
          </div>
          <span className="badge badge-neutral">{events.length} events</span>
        </div>
        <div className="data-table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>Actor</th>
                <th>Action</th>
                <th>Entity</th>
                <th>Reference</th>
              </tr>
            </thead>
            <tbody>
              {events.map((event) => (
                <tr key={event.id}>
                  <td className="mono">{event.createdAt.toLocaleString()}</td>
                  <td>{event.actor?.fullName ?? <span className="muted">Public / system</span>}</td>
                  <td>
                    <span className="badge badge-neutral">{event.action}</span>
                  </td>
                  <td>{event.entityType}</td>
                  <td className="mono muted">{event.entityId?.slice(0, 8) ?? "—"}</td>
                </tr>
              ))}
              {events.length === 0 && (
                <tr>
                  <td colSpan={5} className="empty-state">
                    No audit entries yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="panel-body">
          <p className="field-help">
            Audit records are protected by application policy, but this release does not provide a
            database-enforced immutable ledger. Production operators must restrict direct database privileges
            and configure tested backups/retention.
          </p>
        </div>
      </section>
    </>
  );
}
