import { Users, UserCog } from "lucide-react";
import { getUsers } from "@/server/services/queries";
import { InviteUserForm } from "@/components/forms";
import { PageHeading } from "@/components/page-heading";

export default async function SettingsPage() {
  const users = await getUsers();
  return (
    <>
      <PageHeading
        eyebrow="Access control"
        title="Administration"
        description="Manage invited staff accounts and least-privilege roles. Public self-registration and customer-facing account creation are disabled."
        actions={
          <span className="badge badge-neutral">
            <UserCog size={12} />
            Administrator only
          </span>
        }
      />
      <InviteUserForm />
      <section className="panel" style={{ marginTop: 14 }}>
        <div className="panel-head">
          <div>
            <h2 className="panel-title">Team accounts</h2>
            <p className="panel-subtitle">
              Role changes require an administrator; account deletion is intentionally unavailable in this
              MVP.
            </p>
          </div>
          <span className="badge badge-neutral">
            <Users size={12} />
            {users.length} accounts
          </span>
        </div>
        <div className="data-table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
                <th>Last sign-in</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id}>
                  <td>
                    <strong>{user.fullName}</strong>
                  </td>
                  <td>{user.email}</td>
                  <td>
                    <span className="badge badge-neutral">{user.role}</span>
                  </td>
                  <td>
                    {user.isActive ? (
                      <span className="badge badge-green">Active</span>
                    ) : (
                      <span className="badge badge-red">Suspended</span>
                    )}
                  </td>
                  <td>{user.lastLoginAt?.toLocaleString() ?? <span className="muted">Never</span>}</td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td colSpan={5} className="empty-state">
                    No team accounts found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
      <div className="simulation-banner" style={{ marginTop: 14 }}>
        <span className="badge badge-amber">SECURITY NOTE</span>
        <span>
          Temporary passwords are never emailed by this software. Share them through an organization-approved
          secure channel and rotate them using the organization’s supported identity lifecycle before
          production rollout. MFA, SSO, bulk import and self-service resets are future-phase work.
        </span>
      </div>
    </>
  );
}
