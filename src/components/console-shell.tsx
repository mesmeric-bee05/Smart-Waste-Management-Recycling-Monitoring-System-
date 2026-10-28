import { signOut } from "@/auth";
import { Navigation } from "@/components/navigation";
import type { Role } from "@/generated/prisma/client";
import { LogOut } from "lucide-react";

const labels: Record<string, string> = {
  "/dashboard": "Operations overview",
  "/collection-points": "Collection points",
  "/collections": "Collection operations",
  "/recycling": "Recycling & diversion",
  "/telemetry": "Simulated telemetry",
  "/requests": "Community requests",
  "/reports": "Reports & exports",
  "/audit": "Audit trail",
  "/settings": "Administration",
};

export async function ConsoleShell({
  children,
  actor,
  pathname,
}: {
  children: React.ReactNode;
  actor: { id: string; fullName: string; email: string; role: Role };
  pathname: string;
}) {
  async function logout() {
    "use server";
    await signOut({ redirectTo: "/login" });
  }
  const initials = actor.fullName
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0] ?? "")
    .join("")
    .toUpperCase();
  return (
    <div className="app-frame">
      <Navigation role={actor.role} />
      <main className="main-area">
        <header className="topbar">
          <span className="breadcrumb">
            Waste management <span aria-hidden="true">/</span>{" "}
            <strong>{labels[pathname] ?? "Operations"}</strong>
          </span>
          <div className="topbar-right">
            <span className="top-status">
              <span className="status-dot" aria-hidden="true" /> DEMO DATA
            </span>
            <div className="user-chip" aria-label={`${actor.fullName}, ${actor.role.toLowerCase()}`}>
              <span className="avatar" aria-hidden="true">
                {initials}
              </span>
              <span>
                <span className="user-name" style={{ display: "block" }}>
                  {actor.fullName}
                </span>
                <span className="user-role" style={{ display: "block" }}>
                  {actor.role.toLowerCase()}
                </span>
              </span>
            </div>
            <form action={logout}>
              <button type="submit" className="button button-quiet" aria-label="Sign out">
                <LogOut size={15} />
                <span className="desktop-logout">Sign out</span>
              </button>
            </form>
          </div>
        </header>
        {children}
      </main>
    </div>
  );
}
