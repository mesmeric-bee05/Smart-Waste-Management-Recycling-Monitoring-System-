"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  Activity,
  ClipboardList,
  FileBarChart2,
  LayoutDashboard,
  MapPin,
  Menu,
  Recycle,
  Settings2,
  ShieldCheck,
  Truck,
  X,
} from "lucide-react";
import type { Role } from "@/generated/prisma/client";

const links = [
  {
    href: "/dashboard",
    label: "Overview",
    icon: LayoutDashboard,
    roles: ["ADMIN", "SUPERVISOR", "COLLECTOR"],
  },
  {
    href: "/collection-points",
    label: "Collection points",
    icon: MapPin,
    roles: ["ADMIN", "SUPERVISOR", "COLLECTOR"],
  },
  {
    href: "/collections",
    label: "Collections",
    icon: ClipboardList,
    roles: ["ADMIN", "SUPERVISOR", "COLLECTOR"],
  },
  { href: "/recycling", label: "Recycling & diversion", icon: Recycle, roles: ["ADMIN", "SUPERVISOR"] },
  { href: "/telemetry", label: "Telemetry demo", icon: Activity, roles: ["ADMIN", "SUPERVISOR"] },
  { href: "/requests", label: "Community requests", icon: Truck, roles: ["ADMIN", "SUPERVISOR"] },
  { href: "/reports", label: "Reports", icon: FileBarChart2, roles: ["ADMIN", "SUPERVISOR"] },
  { href: "/audit", label: "Audit trail", icon: ShieldCheck, roles: ["ADMIN"] },
  { href: "/settings", label: "Administration", icon: Settings2, roles: ["ADMIN"] },
] as const;

export function Navigation({ role }: { role: Role }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const visible = links.filter((link) => (link.roles as readonly Role[]).includes(role));
  return (
    <>
      <button
        className="mobile-menu-button"
        type="button"
        aria-label={open ? "Close navigation" : "Open navigation"}
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        {open ? <X size={18} /> : <Menu size={18} />}
      </button>
      <aside className="sidebar" data-open={open} aria-label="Primary navigation">
        <Link className="brand" href="/dashboard" onClick={() => setOpen(false)}>
          <span className="brand-mark" aria-hidden="true">
            <Recycle size={22} strokeWidth={2.2} />
          </span>
          <span>
            <span className="brand-name">WasteOps</span>
            <br />
            <span className="brand-sub">Circular operations</span>
          </span>
        </Link>
        <div className="nav-label">Operations</div>
        <nav className="side-nav">
          {visible.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || (href !== "/dashboard" && pathname.startsWith(`${href}/`));
            return (
              <Link
                className="nav-link"
                href={href}
                key={href}
                aria-current={active ? "page" : undefined}
                onClick={() => setOpen(false)}
              >
                <Icon className="nav-icon" aria-hidden="true" />
                <span>{label}</span>
              </Link>
            );
          })}
        </nav>
        <div className="sidebar-foot">
          <div className="environment-note">
            <span className="environment-dot" aria-hidden="true" />
            <span>
              <strong>Simulation environment</strong>
              <br />
              No live devices or fleet data connected.
            </span>
          </div>
        </div>
      </aside>
    </>
  );
}
