import { Inbox } from "lucide-react";
import { getRequests } from "@/server/services/queries";
import { RequestControls } from "@/components/forms";
import { PageHeading } from "@/components/page-heading";

const tones: Record<string, string> = {
  OPEN: "badge-amber",
  ACKNOWLEDGED: "badge-neutral",
  RESOLVED: "badge-green",
  REJECTED: "badge-red",
};

export default async function RequestsPage() {
  const requests = await getRequests();
  return (
    <>
      <PageHeading
        eyebrow="Community intake"
        title="Collection requests"
        description="Review public reports and move them through the recorded acknowledgement and resolution workflow."
        actions={
          <span className="badge badge-neutral">
            <Inbox size={12} />
            {
              requests.filter((request) => request.status === "OPEN" || request.status === "ACKNOWLEDGED")
                .length
            }{" "}
            open
          </span>
        }
      />
      <div className="simulation-banner">
        <span className="badge badge-neutral">PRIVACY</span>
        <span>
          Requester contact details are optional. Collect only information needed to respond; audit records
          intentionally avoid copying names, email addresses or message bodies.
        </span>
      </div>
      <section className="panel" style={{ marginTop: 14 }}>
        <div className="panel-head">
          <div>
            <h2 className="panel-title">Intake ledger</h2>
            <p className="panel-subtitle">
              Requests are organization-scoped and limited to 1,000 characters.
            </p>
          </div>
        </div>
        <div className="data-table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Status</th>
                <th>Received</th>
                <th>Point</th>
                <th>Request details</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {requests.map((request) => (
                <tr key={request.id}>
                  <td>
                    <span className={`badge ${tones[request.status] ?? "badge-neutral"}`}>
                      {request.status}
                    </span>
                  </td>
                  <td>{request.createdAt.toLocaleString()}</td>
                  <td>
                    {request.point ? (
                      <>
                        <strong>{request.point.code}</strong>
                        <br />
                        <span className="muted">{request.point.name}</span>
                      </>
                    ) : (
                      <span className="muted">Not specified</span>
                    )}
                  </td>
                  <td style={{ maxWidth: 360 }}>
                    <strong>{request.requesterName || "Anonymous"}</strong>
                    {request.contactEmail && (
                      <>
                        <br />
                        <span className="field-help">Contact address provided</span>
                      </>
                    )}
                    <p style={{ margin: "5px 0 0", color: "#435650", overflowWrap: "anywhere" }}>
                      {request.message}
                    </p>
                    {request.resolutionNote && (
                      <span className="field-help">Note: {request.resolutionNote}</span>
                    )}
                  </td>
                  <td>
                    <RequestControls requestId={request.id} status={request.status} />
                  </td>
                </tr>
              ))}
              {requests.length === 0 && (
                <tr>
                  <td colSpan={5} className="empty-state">
                    No requests have been received yet.
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
